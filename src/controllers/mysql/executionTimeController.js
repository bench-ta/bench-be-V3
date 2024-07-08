const ExecutionTime = require('../../models/mysql/ExecutionTimeBenchmark');
const os = require('os');
const si = require('systeminformation');
const escomplex = require('escomplex');
const { performance } = require('perf_hooks');
const { sequelize } = require('../../config/mysql');
const babel = require('@babel/core');

async function transpileCode(code, type) {
    const presets = [];
    if (type === 'ReactJS' || type === 'VueJS') {
        presets.push('@babel/preset-react'); // Also handles JSX for Vue if necessary
    }
    if (type === 'AngularJS') {
        presets.push('@babel/preset-typescript');
    }

    try {
        const result = await babel.transformAsync(code, {
            presets: presets,
            filename: `inputCode.${type.toLowerCase()}` // Helps Babel recognize the file type for transpilation
        });
        return result.code; // Transpiled JavaScript code
    } catch (error) {
        console.error('Error during code transpilation:', error.message);
        throw new Error('Transpilation failed: ' + error.message); // Include specific error message
    }
}

function detectFramework(code) {
    if (/React/.test(code) && /ReactDOM/.test(code)) {
        return 'ReactJS';
    } else if (/Vue\.createApp/.test(code) || /new Vue/.test(code)) {
        return 'VueJS';
    } else if (/angular\.module/.test(code)) {
        return 'AngularJS';
    } else {
        return 'JavaScript';
    }
}

exports.startBenchmark = async (req, res) => {
    const { testType, testCodes, testConfig, javascriptType, mongoId } = req.body;

    if (!testType || !testCodes || !testConfig || !javascriptType) {
        return res.status(400).json({ success: false, error: "Please provide all required fields." });
    }

    try {
        const results = await Promise.all(testCodes.map(async (code, index) => {
            const framework = detectFramework(code);
            const transpiledCode = await transpileCode(code, framework);

            let iterationsResults = [];
            let complexityReport = escomplex.analyse(transpiledCode);
            let complexitySummary = {
                cyclomatic: complexityReport.aggregate.cyclomatic,
                sloc: complexityReport.aggregate.sloc,
                halstead: complexityReport.aggregate.halstead,
                maintainability: complexityReport.aggregate.maintainability
            };
            let totalExecutionTime = 0;

            for (let i = 0; i < testConfig.iterations; i++) {
                const startTime = performance.now();
                eval(transpiledCode);
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                totalExecutionTime += executionTime;
                iterationsResults.push({
                    iteration: i + 1,
                    executionTime: `${executionTime.toFixed(2)} ms`
                });
            }

            const averageExecutionTime = totalExecutionTime / testConfig.iterations;

            return {
                testCodeNumber: index + 1,
                testCode: code,
                iterationsResults: iterationsResults,
                averageExecutionTime: `${averageExecutionTime.toFixed(2)} ms`,
                totalExecutionTime: `${totalExecutionTime.toFixed(2)} ms`,
                complexity: complexitySummary
            };
        }));

        const overallAverage = results.reduce((acc, curr) => acc + parseFloat(curr.averageExecutionTime), 0) / results.length;
        const totalExecutionTime = results.reduce((acc, curr) => acc + parseFloat(curr.totalExecutionTime), 0);

        const benchmark = await ExecutionTime.create({
            mongoId, // Optional MongoDB ID
            javascriptType,
            testType,
            testConfig,
            results: JSON.stringify(results),
            overallAverage: `${overallAverage.toFixed(2)} ms`,
            totalExecutionTime: `${totalExecutionTime.toFixed(2)} ms`
        });

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
            message: `Average execution time from ${testConfig.iterations} iterations: ${overallAverage.toFixed(2)} ms`,
            data: benchmark,
            hardware: hardwareInfo
        });
    } catch (error) {
        console.error('Error during benchmark execution:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};