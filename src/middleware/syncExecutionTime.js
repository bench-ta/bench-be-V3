const ExecutionTimeMongo = require('../models/mongo/ExecutionTime');
const ExecutionTimeMySQL = require('../models/mysql/ExecutionTime');
const { checkDatabaseStatus } = require('../config/handlers');

const syncExecutionTime = async () => {
    const status = await checkDatabaseStatus();

    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Synchronizing data...');

        // Sync from MySQL to MongoDB
        const mysqlExecutionTimes = await ExecutionTimeMySQL.findAll({ where: { isDeleted: false } });
        for (const execTime of mysqlExecutionTimes) {
            const existingExecTime = await ExecutionTimeMongo.findOne({ _id: execTime.mongoId });
            if (!existingExecTime || new Date(execTime.updatedAt) > new Date(existingExecTime.updatedAt)) {
                await ExecutionTimeMongo.findOneAndUpdate(
                    { _id: execTime.mongoId },
                    {
                        javascriptType: execTime.javascriptType,
                        testType: execTime.testType,
                        testConfig: execTime.testConfig,
                        results: execTime.results,
                        overallAverage: execTime.overallAverage,
                        isDeleted: execTime.isDeleted,
                        createdAt: execTime.createdAt,
                        updatedAt: execTime.updatedAt
                    },
                    { upsert: true }
                );
                console.log(`ExecutionTime ${execTime.mongoId} synced from MySQL to MongoDB`);
            }
        }

        // Sync from MongoDB to MySQL
        const mongoExecutionTimes = await ExecutionTimeMongo.find({ isDeleted: false });
        for (const execTime of mongoExecutionTimes) {
            if (!execTime._id) continue; // Skip if mongoId is not present

            const existingExecTime = await ExecutionTimeMySQL.findOne({ where: { mongoId: execTime._id.toString() } });

            if (!existingExecTime) {
                // Create new entry if it doesn't exist
                await ExecutionTimeMySQL.create({
                    mongoId: execTime._id.toString(),
                    javascriptType: execTime.javascriptType,
                    testType: execTime.testType,
                    testConfig: execTime.testConfig,
                    results: execTime.results,
                    overallAverage: execTime.overallAverage,
                    isDeleted: execTime.isDeleted,
                    createdAt: execTime.createdAt,
                    updatedAt: execTime.updatedAt
                });
                console.log(`ExecutionTime ${execTime._id} added from MongoDB to MySQL`);
            } else if (new Date(execTime.updatedAt) > new Date(existingExecTime.updatedAt)) {
                // Update existing entry if the MongoDB data is newer
                await ExecutionTimeMySQL.update({
                    javascriptType: execTime.javascriptType,
                    testType: execTime.testType,
                    testConfig: execTime.testConfig,
                    results: execTime.results,
                    overallAverage: execTime.overallAverage,
                    isDeleted: execTime.isDeleted,
                    createdAt: execTime.createdAt,
                    updatedAt: execTime.updatedAt
                }, { where: { mongoId: execTime._id.toString() } });
                console.log(`ExecutionTime ${execTime._id} updated from MongoDB to MySQL`);
            }
        }
    } else if (status.mongoConnected) {
        console.log('Only MongoDB is connected. Using MongoDB for data operations.');
        // Data operations when only MongoDB is connected
    } else if (status.mysqlConnected) {
        console.log('Only MySQL is connected. Using MySQL for data operations.');
        // Data operations when only MySQL is connected
    } else {
        console.log('Neither MongoDB nor MySQL is connected. Skipping synchronization.');
    }
};

module.exports = { syncExecutionTime };
