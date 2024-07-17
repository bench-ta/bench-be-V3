// src/controllers/mysql/pageLoadController.js
const PageLoadBenchmark = require('../../models/mysql/PageLoadBenchmark');
const os = require('os');
const si = require('systeminformation');
const escomplex = require('escomplex');
const { performance } = require('perf_hooks');
const { ObjectId } = require('bson');
const v8 = require('v8');
const babel = require('@babel/core');
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');

// Fungsi untuk mendapatkan penggunaan memori
function getMemoryUsage() {
    return v8.getHeapStatistics().used_heap_size;
}

// Fungsi untuk transpilasi kode
async function transpileCode(code, type) {
    const presets = [];
    if (type === 'React' || type === 'Vue') {
        presets.push('@babel/preset-react');
    }
    if (type === 'Angular') {
        presets.push('@babel/preset-typescript');
    }

    try {
        const result = await babel.transformAsync(code, {
            presets: presets,
            filename: `inputCode.${type.toLowerCase()}`
        });
        return result.code;
    } catch (error) {
        console.error('Error during code transpilation:', error.message);
        throw new Error('Transpilation failed: ' + error.message);
    }
}

// Fungsi untuk memulai benchmark
exports.startBenchmark = async (req, res) => {
    const { testType, testCodes, testConfig, javascriptType } = req.body;

    if (!testType || !testCodes || !testConfig || !javascriptType) {
        return res.status(400).json({ success: false, error: "Please provide all required fields." });
    }

    try {
        const transpiledCodes = await Promise.all(testCodes.map(code => transpileCode(code, javascriptType)));

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const results = [];

        for (const code of transpiledCodes) {
            const complexityReport = escomplex.analyse(code);
            const complexitySummary = {
                cyclomatic: complexityReport.aggregate.cyclomatic,
                sloc: complexityReport.aggregate.sloc,
                halstead: complexityReport.aggregate.halstead,
                maintainability: complexityReport.aggregate.maintainability
            };

            let iterationsResults = [];
            let totalExecutionTime = 0;
            let totalMemoryUsage = 0;

            for (let i = 0; i < testConfig.iterations; i++) {
                const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
                const { window } = dom;
                global.window = window;
                global.document = window.document;

                const startMem = getMemoryUsage();
                const startTime = performance.now();
                await page.evaluate(code);
                const endTime = performance.now();
                const endMem = getMemoryUsage();
                const executionTime = endTime - startTime;
                const memoryUsed = endMem - startMem;
                totalExecutionTime += executionTime;
                totalMemoryUsage += memoryUsed;

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
            const averageMemoryUsage = totalMemoryUsage / testConfig.iterations;

            results.push({
                testCodeNumber: results.length + 1,
                testCode: code,
                iterationsResults: iterationsResults,
                averagePageLoadTime: `${averagePageLoadTime.toFixed(2)} ms`,
                averageMemoryUsage: `${averageMemoryUsage.toFixed(2)} KB`,
                totalExecutionTime: `${totalExecutionTime.toFixed(2)} ms`,
                totalMemoryUsage: `${(totalMemoryUsage / 1024).toFixed(2)} KB`,
                complexity: complexitySummary
            });
        }

        const totalAveragePageLoadTime = results.reduce((acc, curr) => acc + parseFloat(curr.averagePageLoadTime), 0) / results.length;
        const overallAverageMemoryUsage = results.reduce((acc, curr) => acc + parseFloat(curr.averageMemoryUsage), 0) / results.length;
        const totalExecutionTimeSum = results.reduce((acc, curr) => acc + parseFloat(curr.totalExecutionTime), 0);
        const totalMemoryUsageSum = results.reduce((acc, curr) => acc + parseFloat(curr.totalMemoryUsage), 0);

        const mongoId = new ObjectId().toString();

        const benchmark = await PageLoadBenchmark.create({
            mongoId,
            userId: req.user._id,
            javascriptType,
            testType,
            testConfig,
            results,
            overallAveragePageLoadTime: `${totalAveragePageLoadTime.toFixed(2)} ms`,
            overallAverageMemoryUsage: `${overallAverageMemoryUsage.toFixed(2)} KB`,
            totalExecutionTime: `${totalExecutionTimeSum.toFixed(2)} ms`,
            totalMemoryUsage: `${(totalMemoryUsageSum / 1024).toFixed(2)} KB`
        });

        await browser.close();

        const cpuInfo = os.cpus()[0];
        const totalMemoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemoryGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const osInfo = {
            type: os.type(),
            platform: os.platform(),
            release: os.release(),
            arch: os.arch()
        };

        let systemInfo = {};
        try {
            systemInfo = await si.getStaticData();
        } catch (error) {
            console.error('Failed to retrieve system information:', error);
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
