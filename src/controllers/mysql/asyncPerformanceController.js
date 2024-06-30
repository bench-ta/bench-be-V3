const AsyncPerformanceBenchmark = require('../../models/mysql/AsyncPerformanceBenchmark');
const os = require('os');
const si = require('systeminformation');
const { performance } = require('perf_hooks');
const { ObjectId } = require('bson');

exports.startBenchmark = async (req, res) => {
    const { testType, testCodes, testConfig, javascriptType } = req.body;

    if (!testType || !testCodes || !testConfig || !javascriptType) {
        return res.status(400).json({ success: false, error: "Please provide all required fields." });
    }

    try {
        const results = await Promise.all(testCodes.map(async (code, index) => {
            let iterationsResults = [];
            let totalExecutionTime = 0;

            for (let i = 0; i < testConfig.iterations; i++) {
                const startTime = performance.now();
                await eval(code);
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                totalExecutionTime += executionTime;
                iterationsResults.push({
                    iteration: i + 1,
                    executionTime: `${executionTime.toFixed(2)} ms`
                });
            }
            const averageAsyncExecution = totalExecutionTime / testConfig.iterations;

            return {
                testCodeNumber: index + 1,
                testCode: code,
                iterationsResults: iterationsResults,
                averageAsyncExecution: `${averageAsyncExecution.toFixed(2)} ms`
            };
        }));

        const overallAverage = results.reduce((acc, curr) => acc + parseFloat(curr.averageAsyncExecution), 0) / results.length;

        const mongoId = new ObjectId().toString();

        const benchmark = await AsyncPerformanceBenchmark.create({
            mongoId,
            javascriptType,
            testType,
            testConfig,
            results,
            totalAverageAsyncExecution: `${overallAverage.toFixed(2)} ms`
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
            message: `Average async execution time from ${testConfig.iterations} iterations: ${overallAverage.toFixed(2)} ms`,
            data: benchmark,
            hardware: hardwareInfo
        });
    } catch (error) {
        console.error('Error during benchmark execution:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};