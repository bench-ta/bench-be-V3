// src/controllers/executionTimeController.js

const ExecutionTimeMongo = require('../models/mongo/ExecutionTime');
const ExecutionTimeMySQL = require('../models/mysql/ExecutionTime');
const { performance } = require('perf_hooks');
const escomplex = require('escomplex');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const si = require('systeminformation');
const { checkDatabaseStatus } = require('../config/handlers');

exports.startBenchmark = async (req, res) => {
    const { testType, testCodes, testConfig, javascriptType } = req.body;

    if (!testType || !testCodes || !testConfig || !javascriptType) {
        return res.status(400).json({ success: false, error: "Please provide all required fields." });
    }

    try {
        // Analyze and benchmark the provided code
        const results = testCodes.map((code, index) => {
            let iterationsResults = [];
            let complexityReport = escomplex.analyse(code);
            let complexitySummary = {
                cyclomatic: complexityReport.aggregate.cyclomatic,
                sloc: complexityReport.aggregate.sloc,
                halstead: complexityReport.aggregate.halstead,
                maintainability: complexityReport.aggregate.maintainability
            };
            for (let i = 0; i < testConfig.iterations; i++) {
                const startTime = performance.now();
                eval(code);
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                iterationsResults.push({
                    iteration: i + 1,
                    executionTime: `${executionTime.toFixed(2)} ms`
                });
            }
            const averageExecutionTime = iterationsResults.reduce((acc, curr) => acc + parseFloat(curr.executionTime), 0) / testConfig.iterations;
            return {
                testCodeNumber: index + 1,
                testCode: code,
                iterationsResults: iterationsResults,
                averageExecutionTime: `${averageExecutionTime.toFixed(2)} ms`,
                complexity: complexitySummary
            };
        });

        const overallAverage = results.reduce((acc, curr) => acc + parseFloat(curr.averageExecutionTime), 0) / results.length;

        // Check database connectivity
        const status = await checkDatabaseStatus();

        if (status.mongoConnected) {
            // Save to MongoDB
            const benchmark = await ExecutionTimeMongo.create({
                javascriptType,
                testType,
                testConfig,
                results,
                overallAverage: `${overallAverage.toFixed(2)} ms`
            });

            // If MySQL is also connected, sync to MySQL
            if (status.mysqlConnected) {
                await ExecutionTimeMySQL.create({
                    mongoId: benchmark._id.toString(),
                    javascriptType,
                    testType,
                    testConfig,
                    results,
                    overallAverage: `${overallAverage.toFixed(2)} ms`
                });
            }

            res.status(201).json({
                success: true,
                message: `Benchmark saved to MongoDB. Average execution time: ${overallAverage.toFixed(2)} ms`,
                data: benchmark
            });
        } else if (status.mysqlConnected) {
            // Save to MySQL directly if MongoDB is not available
            const benchmark = await ExecutionTimeMySQL.create({
                mongoId: null,
                javascriptType,
                testType,
                testConfig,
                results,
                overallAverage: `${overallAverage.toFixed(2)} ms`
            });

            res.status(201).json({
                success: true,
                message: `MongoDB not available. Benchmark saved to MySQL. Average execution time: ${overallAverage.toFixed(2)} ms`,
                data: benchmark
            });
        } else {
            // No database available
            res.status(500).json({ success: false, error: 'No database connection available to save benchmark data.' });
        }
    } catch (error) {
        console.error('Error during benchmark execution:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
