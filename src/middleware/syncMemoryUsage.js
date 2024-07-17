const MemoryUsageBenchmarkMongo = require('../models/mongo/MemoryUsageBenchmark');
const MemoryUsageBenchmarkMySQL = require('../models/mysql/MemoryUsageBenchmark');
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
        const mongoBenchmarks = await MemoryUsageBenchmarkMongo.find({ isDeleted: false });
        for (const benchmark of mongoBenchmarks) {
            let mongoIdStr = benchmark._id.toString();
            let userIdStr = benchmark.userId.toString();
            const existingBenchmark = await MemoryUsageBenchmarkMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingBenchmark) {
                await MemoryUsageBenchmarkMySQL.create({
                    mongoId: mongoIdStr,
                    userId: userIdStr,
                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAverage: benchmark.overallAverage,
                    totalMemoryUsage: benchmark.totalMemoryUsage || '0', // Pastikan tidak null
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                });
                console.log(`MemoryUsageBenchmark ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                await MemoryUsageBenchmarkMySQL.update({
                    userId: userIdStr,
                    javascriptType: benchmark.javascriptType,
                    testType: benchmark.testType,
                    testConfig: benchmark.testConfig,
                    results: benchmark.results,
                    overallAverage: benchmark.overallAverage,
                    totalMemoryUsage: benchmark.totalMemoryUsage || '0', // Pastikan tidak null
                    isDeleted: benchmark.isDeleted,
                    createdAt: benchmark.createdAt,
                    updatedAt: benchmark.updatedAt
                }, { where: { mongoId: mongoIdStr } });
                console.log(`MemoryUsageBenchmark ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlBenchmarks = await MemoryUsageBenchmarkMySQL.findAll({ where: { isDeleted: false } });
        for (const benchmark of mysqlBenchmarks) {
            if (benchmark.mongoId && isValidObjectId(benchmark.mongoId)) {
                const existingBenchmark = await MemoryUsageBenchmarkMongo.findById(benchmark.mongoId);
                if (!existingBenchmark) {
                    let newBenchmark = new MemoryUsageBenchmarkMongo({
                        _id: benchmark.mongoId, // Use MySQL's mongoId to keep IDs consistent
                        userId: benchmark.userId,
                        javascriptType: benchmark.javascriptType,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAverage: benchmark.overallAverage,
                        totalMemoryUsage: benchmark.totalMemoryUsage || '0', // Pastikan tidak null
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    });
                    await newBenchmark.save();
                    console.log(`MemoryUsageBenchmark ${benchmark.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(benchmark.updatedAt) > new Date(existingBenchmark.updatedAt)) {
                    await MemoryUsageBenchmarkMongo.findByIdAndUpdate(benchmark.mongoId, {
                        javascriptType: benchmark.javascriptType,
                        userId: benchmark.userId,
                        testType: benchmark.testType,
                        testConfig: benchmark.testConfig,
                        results: benchmark.results,
                        overallAverage: benchmark.overallAverage,
                        totalMemoryUsage: benchmark.totalMemoryUsage || '0', // Pastikan tidak null
                        isDeleted: benchmark.isDeleted,
                        createdAt: benchmark.createdAt,
                        updatedAt: benchmark.updatedAt
                    }, { new: true });
                    console.log(`MemoryUsageBenchmark ${benchmark.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncMemoryUsage };
