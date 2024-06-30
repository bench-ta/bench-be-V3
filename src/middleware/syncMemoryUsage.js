const MemoryBenchmarkMongo = require('../models/mongo/MemoryBenchmark');
const MemoryBenchmarkMySQL = require('../models/mysql/MemoryBenchmark');
const { checkDatabaseStatus } = require('../config/handlers');
const { ObjectId } = require('bson');

const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

const syncMemoryUsage = async () => {
    const status = await checkDatabaseStatus();

    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Synchronizing data...');

        // Sync from MongoDB to MySQL
        const mongoBenchmarks = await MemoryBenchmarkMongo.find({ isDeleted: false });
        for (const benchmark of mongoBenchmarks) {
            let mongoIdStr = benchmark._id.toString();
            const existingBenchmark = await MemoryBenchmarkMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingBenchmark) {
                await MemoryBenchmarkMySQL.create({
                    mongoId: mongoIdStr,
                    testType: benchmark.testType,
                    testCodes: benchmark.testCodes,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    averageMemoryUsage: benchmark.averageMemoryUsage,
                    totalAverageMemoryUsage: benchmark.totalAverageMemoryUsage,
                    timestamp: benchmark.timestamp,
                    javascriptType: benchmark.javascriptType,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                });
                console.log(`MemoryBenchmark ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                await MemoryBenchmarkMySQL.update({
                    testType: benchmark.testType,
                    testCodes: benchmark.testCodes,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    averageMemoryUsage: benchmark.averageMemoryUsage,
                    totalAverageMemoryUsage: benchmark.totalAverageMemoryUsage,
                    timestamp: benchmark.timestamp,
                    javascriptType: benchmark.javascriptType,
                    updatedAt: new Date()
                }, { where: { mongoId: mongoIdStr } });
                console.log(`MemoryBenchmark ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlBenchmarks = await MemoryBenchmarkMySQL.findAll({ where: { isDeleted: false } });
        for (const benchmark of mysqlBenchmarks) {
            if (benchmark.mongoId && isValidObjectId(benchmark.mongoId)) {
                const existingBenchmark = await MemoryBenchmarkMongo.findById(benchmark.mongoId);
                if (!existingBenchmark) {
                    const newBenchmark = new MemoryBenchmarkMongo({
                        _id: benchmark.mongoId,
                        testType: benchmark.testType,
                        testCodes: benchmark.testCodes,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        averageMemoryUsage: benchmark.averageMemoryUsage,
                        totalAverageMemoryUsage: benchmark.totalAverageMemoryUsage,
                        timestamp: benchmark.timestamp,
                        javascriptType: benchmark.javascriptType,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    });
                    await newBenchmark.save();
                    console.log(`MemoryBenchmark ${benchmark.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                    await MemoryBenchmarkMongo.findByIdAndUpdate(benchmark.mongoId, {
                        testType: benchmark.testType,
                        testCodes: benchmark.testCodes,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        averageMemoryUsage: benchmark.averageMemoryUsage,
                        totalAverageMemoryUsage: benchmark.totalAverageMemoryUsage,
                        timestamp: benchmark.timestamp,
                        javascriptType: benchmark.javascriptType,
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: new Date()
                    }, { new: true });
                    console.log(`MemoryBenchmark ${benchmark.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncMemoryUsage };
