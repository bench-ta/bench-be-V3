const ExecutionTimeMongo = require('../models/mongo/ExecutionTimeBenchmark');
const ExecutionTimeMySQL = require('../models/mysql/ExecutionTimeBenchmark');
const { checkDatabaseStatus } = require('../config/handlers');
const { ObjectId } = require('bson');

const isValidObjectId = (id) => {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

const syncExecutionTime = async () => {
    const status = await checkDatabaseStatus();

    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Synchronizing data...');

        // Sync from MongoDB to MySQL
        const mongoExecutionTimes = await ExecutionTimeMongo.find({ isDeleted: false });
        for (const execTime of mongoExecutionTimes) {
            let mongoIdStr = execTime._id.toString();
            let userIdStr = execTime.userId.toString();
            const existingExecTime = await ExecutionTimeMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingExecTime) {
                await ExecutionTimeMySQL.create({
                    mongoId: mongoIdStr,
                    userId: userIdStr,
                    javascriptType: execTime.javascriptType,
                    testType: execTime.testType,
                    testConfig: execTime.testConfig,
                    results: execTime.results,
                    overallAverage: execTime.overallAverage,
                    totalExecutionTime: execTime.totalExecutionTime,  // Menambahkan totalExecutionTime
                    isDeleted: execTime.isDeleted,
                    createdAt: execTime.createdAt,
                    updatedAt: execTime.updatedAt
                });
                console.log(`ExecutionTime ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(execTime.updatedAt) > new Date(existingExecTime.updatedAt)) {
                await ExecutionTimeMySQL.update({
                    userId: userIdStr,
                    javascriptType: execTime.javascriptType,
                    testType: execTime.testType,
                    testConfig: execTime.testConfig,
                    results: execTime.results,
                    overallAverage: execTime.overallAverage,
                    totalExecutionTime: execTime.totalExecutionTime,  // Menambahkan totalExecutionTime
                    isDeleted: execTime.isDeleted,
                    createdAt: execTime.createdAt,
                    updatedAt: execTime.updatedAt
                }, { where: { mongoId: mongoIdStr } });
                console.log(`ExecutionTime ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlExecutionTimes = await ExecutionTimeMySQL.findAll({ where: { isDeleted: false } });
        for (const execTime of mysqlExecutionTimes) {
            if (execTime.mongoId && isValidObjectId(execTime.mongoId)) {
                const existingExecTime = await ExecutionTimeMongo.findById(execTime.mongoId);
                if (!existingExecTime) {
                    let newExecTime = new ExecutionTimeMongo({
                        _id: execTime.mongoId, // Use MySQL's mongoId to keep IDs consistent
                        userId: execTime.userId,
                        javascriptType: execTime.javascriptType,
                        testType: execTime.testType,
                        testConfig: execTime.testConfig,
                        results: execTime.results,
                        overallAverage: execTime.overallAverage,
                        totalExecutionTime: execTime.totalExecutionTime,  // Menambahkan totalExecutionTime
                        isDeleted: execTime.isDeleted,
                        createdAt: execTime.createdAt,
                        updatedAt: execTime.updatedAt
                    });
                    await newExecTime.save();
                    console.log(`ExecutionTime ${execTime.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(execTime.updatedAt) > new Date(existingExecTime.updatedAt)) {
                    await ExecutionTimeMongo.findByIdAndUpdate(execTime.mongoId, {
                        javascriptType: execTime.javascriptType,
                        userId: execTime.userId,
                        testType: execTime.testType,
                        testConfig: execTime.testConfig,
                        results: execTime.results,
                        overallAverage: execTime.overallAverage,
                        totalExecutionTime: execTime.totalExecutionTime,  // Menambahkan totalExecutionTime
                        isDeleted: execTime.isDeleted,
                        createdAt: execTime.createdAt,
                        updatedAt: execTime.updatedAt
                    }, { new: true });
                    console.log(`ExecutionTime ${execTime.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncExecutionTime };