const { JSDOM } = require('jsdom');
const os = require('os');
const si = require('systeminformation');
const escomplex = require('escomplex');
const { performance } = require('perf_hooks');
const v8 = require('v8');
const babel = require('@babel/core');
const PageLoadBenchmark = require('../../models/mongo/PageLoadBenchmark'); // or MySQL based on your setup

// Function to get memory usage
function getMemoryUsage() {
    return v8.getHeapStatistics().used_heap_size;
}

// Function for code transpilation
async function transpileCode(code, type) {
    const presets = [];
    if (type === 'React' || type === 'Vue') {
        presets.push('@babel/preset-react'); // Also handles JSX for Vue if necessary
    }
    if (type === 'Angular') {
        presets.push('@babel/preset-typescript');
    }

    try {
        const result = await babel.transformAsync(code, {
            presets: presets,
            filename: `inputCode.${type.toLowerCase()}` // Helps Babel recognize the file type for transpilation
        });
        return result.code;
    } catch (error) {
        console.error('Error during code transpilation:', error.message);
        throw new Error('Transpilation failed: ' + error.message);
    }
}

// Endpoint to start benchmark
exports.startBenchmark = async (req, res) => {
    const { testType, testCodes, testConfig, javascriptType } = req.body;

    if (!testType || !testCodes || !testConfig || !javascriptType) {
        return res.status(400).json({ success: false, error: "Please provide all required fields." });
    }

    try {
        const transpiledCodes = await Promise.all(testCodes.map(code => transpileCode(code, javascriptType)));

        const results = transpiledCodes.map((code, index) => {
            let iterationsResults = [];
            let totalExecutionTime = 0;
            let complexityReport = escomplex.analyse(code);
            let complexitySummary = {
                cyclomatic: complexityReport.aggregate.cyclomatic,
                sloc: complexityReport.aggregate.sloc,
                halstead: complexityReport.aggregate.halstead,
                maintainability: complexityReport.aggregate.maintainability
            };

            for (let i = 0; i < testConfig.iterations; i++) {
                const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
                const { window } = dom;
                global.window = window;
                global.document = window.document;

                const startMem = getMemoryUsage();
                const startTime = performance.now();
                eval(code); // Evaluating the transpiled code
                const endTime = performance.now();
                const endMem = getMemoryUsage();
                const executionTime = endTime - startTime;
                const memoryUsed = endMem - startMem;
                totalExecutionTime += executionTime;

                iterationsResults.push({
                    iteration: i + 1,
                    executionTime: `${executionTime.toFixed(2)} ms`,
                    memoryUsed: `${(memoryUsed / 1024).toFixed(2)} KB`
                });

                // Cleanup
                delete global.window;
                delete global.document;
            }

            const averagePageLoadTime = totalExecutionTime / testConfig.iterations;
            const averageMemoryUsage = iterationsResults.reduce((acc, curr) => acc + parseFloat(curr.memoryUsed), 0) / testConfig.iterations;

            return {
                testCodeNumber: index + 1,
                testCode: code,
                iterationsResults: iterationsResults,
                averagePageLoadTime: `${averagePageLoadTime.toFixed(2)} ms`,
                averageMemoryUsage: `${averageMemoryUsage.toFixed(2)} KB`,
                complexity: complexitySummary
            };
        });

        const totalAveragePageLoadTime = results.reduce((acc, curr) => acc + parseFloat(curr.averagePageLoadTime), 0) / results.length;
        const overallAverageMemoryUsage = results.reduce((acc, curr) => acc + parseFloat(curr.averageMemoryUsage), 0) / results.length;

        const benchmark = new PageLoadBenchmark({
            testType,
            testCodes,
            testConfig,
            results,
            overallAveragePageLoadTime: `${totalAveragePageLoadTime.toFixed(2)} ms`,
            overallAverageMemoryUsage: `${overallAverageMemoryUsage.toFixed(2)} KB`,
            javascriptType
        });

        await benchmark.save();

        const cpuInfo = os.cpus()[0];
        const totalMemoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemoryGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const osInfo = {
            type: os.type(),
            platform: os.platform(),
            release: os.release(),
            arch: os.arch()
        };

        let systemInfo;
        try {
            systemInfo = await si.getStaticData();
        } catch (error) {
            console.error('Failed to retrieve system information:', error);
            systemInfo = {}; // Use an empty object if unable to retrieve system info
        }

        const hardwareInfo = {
            os: osInfo,
            cpu: {
                model: cpuInfo.model,
                speed: `${cpuInfo.speed} MHz`
            },
            totalMemory: `${totalMemoryGB} GB`,
            freeMemory: `${freeMemoryGB} GB`,
            gpu: systemInfo.graphics ? systemInfo.graphics.controllers.map(gpu => ({
                model: gpu.model,
                vram: gpu.vram ? `${gpu.vram} MB` : 'N/A'
            })) : [{ model: 'Not available', vram: 'N/A' }],
            system: systemInfo.system ? {
                manufacturer: systemInfo.system.manufacturer,
                model: systemInfo.system.model,
                version: systemInfo.system.version
            } : { manufacturer: 'Not available', model: 'Not available', version: 'Not available' }
        };

        res.status(201).json({
            success: true,
            message: `Average page load time from ${testConfig.iterations} iterations: ${totalAveragePageLoadTime.toFixed(2)} ms`,
            data: benchmark,
            hardware: hardwareInfo
        });
    } catch (error) {
        console.error('Error during benchmark execution:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
