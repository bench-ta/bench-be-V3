// src/middleware/syncAsyncPerformance.js
const AsyncPerformanceBenchmarkMongo = require('../models/mongo/AsyncPerformanceBenchmark');
const AsyncPerformanceBenchmarkMySQL = require('../models/mysql/AsyncPerformanceBenchmark');
const { checkDatabaseStatus } = require('../config/handlers');
const { ObjectId } = require('bson');

const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

const syncAsyncPerformance = async () => {
    const status = await checkDatabaseStatus();

    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Synchronizing data...');

        // Sync from MongoDB to MySQL
        const mongoBenchmarks = await AsyncPerformanceBenchmarkMongo.find({ isDeleted: false });
        for (const benchmark of mongoBenchmarks) {
            let mongoIdStr = benchmark._id.toString();
            const existingBenchmark = await AsyncPerformanceBenchmarkMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingBenchmark) {
                await AsyncPerformanceBenchmarkMySQL.create({
                    mongoId: mongoIdStr,
                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAverage: benchmark.overallAverage,
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                });
                console.log(`AsyncPerformanceBenchmark ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                await AsyncPerformanceBenchmarkMySQL.update({
                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAverage: benchmark.overallAverage,
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                }, { where: { mongoId: mongoIdStr } });
                console.log(`AsyncPerformanceBenchmark ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlBenchmarks = await AsyncPerformanceBenchmarkMySQL.findAll({ where: { isDeleted: false } });
        for (const benchmark of mysqlBenchmarks) {
            if (benchmark.mongoId && isValidObjectId(benchmark.mongoId)) {
                const existingBenchmark = await AsyncPerformanceBenchmarkMongo.findById(benchmark.mongoId);
                if (!existingBenchmark) {
                    let newBenchmark = new AsyncPerformanceBenchmarkMongo({
                        _id: benchmark.mongoId,
                        javascriptType: benchmark.javascriptType,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAverage: benchmark.overallAverage,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    });
                    await newBenchmark.save();
                    console.log(`AsyncPerformanceBenchmark ${benchmark.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                    await AsyncPerformanceBenchmarkMongo.findByIdAndUpdate(benchmark.mongoId, {
                        javascriptType: benchmark.javascriptType,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAverage: benchmark.overallAverage,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    }, { new: true });
                    console.log(`AsyncPerformanceBenchmark ${benchmark.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncAsyncPerformance };
