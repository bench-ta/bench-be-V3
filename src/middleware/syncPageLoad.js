// src/middleware/syncPageLoad.js
const PageLoadBenchmarkMongo = require('../models/mongo/PageLoadBenchmark');
const PageLoadBenchmarkMySQL = require('../models/mysql/PageLoadBenchmark');
const { checkDatabaseStatus } = require('../config/handlers');
const { ObjectId } = require('bson');

const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

const syncPageLoad = async () => {
    const status = await checkDatabaseStatus();

    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Synchronizing data...');

        // Sync from MongoDB to MySQL
        const mongoBenchmarks = await PageLoadBenchmarkMongo.find({ isDeleted: false });
        for (const benchmark of mongoBenchmarks) {
            let mongoIdStr = benchmark._id.toString();
            let userIdStr = benchmark.userId.toString();

            const existingBenchmark = await PageLoadBenchmarkMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingBenchmark) {
                await PageLoadBenchmarkMySQL.create({
                    mongoId: mongoIdStr,
                    userId: userIdStr,

                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAveragePageLoadTime: benchmark.overallAveragePageLoadTime,
                    overallAverageMemoryUsage: benchmark.overallAverageMemoryUsage,
                    totalExecutionTime: benchmark.totalExecutionTime,
                    totalMemoryUsage: benchmark.totalMemoryUsage,
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                });
                console.log(`PageLoadBenchmark ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                await PageLoadBenchmarkMySQL.update({
                    userId: userIdStr,

                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAveragePageLoadTime: benchmark.overallAveragePageLoadTime,
                    overallAverageMemoryUsage: benchmark.overallAverageMemoryUsage,
                    totalExecutionTime: benchmark.totalExecutionTime,
                    totalMemoryUsage: benchmark.totalMemoryUsage,
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                }, { where: { mongoId: mongoIdStr } });
                console.log(`PageLoadBenchmark ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlBenchmarks = await PageLoadBenchmarkMySQL.findAll({ where: { isDeleted: false } });
        for (const benchmark of mysqlBenchmarks) {
            if (benchmark.mongoId && isValidObjectId(benchmark.mongoId)) {
                const existingBenchmark = await PageLoadBenchmarkMongo.findById(benchmark.mongoId);
                if (!existingBenchmark) {
                    let newBenchmark = new PageLoadBenchmarkMongo({
                        _id: benchmark.mongoId, // Use MySQL's mongoId to keep IDs consistent
                        userId: benchmark.userId,

                        javascriptType: benchmark.javascriptType,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAveragePageLoadTime: benchmark.overallAveragePageLoadTime,
                        overallAverageMemoryUsage: benchmark.overallAverageMemoryUsage,
                        totalExecutionTime: benchmark.totalExecutionTime,
                        totalMemoryUsage: benchmark.totalMemoryUsage,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    });
                    await newBenchmark.save();
                    console.log(`PageLoadBenchmark ${benchmark.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                    await PageLoadBenchmarkMongo.findByIdAndUpdate(benchmark.mongoId, {
                        userId: benchmark.userId,

                        javascriptType: benchmark.javascriptType,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAveragePageLoadTime: benchmark.overallAveragePageLoadTime,
                        overallAverageMemoryUsage: benchmark.overallAverageMemoryUsage,
                        totalExecutionTime: benchmark.totalExecutionTime,
                        totalMemoryUsage: benchmark.totalMemoryUsage,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    }, { new: true });
                    console.log(`PageLoadBenchmark ${benchmark.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncPageLoad };
