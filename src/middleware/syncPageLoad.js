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
        const mongoPageLoads = await PageLoadBenchmarkMongo.find({ isDeleted: false });
        for (const pageLoad of mongoPageLoads) {
            let mongoIdStr = pageLoad._id.toString();
            const existingPageLoad = await PageLoadBenchmarkMySQL.findOne({ where: { mongoId: mongoIdStr } });

            if (!existingPageLoad) {
                await PageLoadBenchmarkMySQL.create({
                    mongoId: mongoIdStr,
                    javascriptType: pageLoad.javascriptType,
                    testType: pageLoad.testType,
                    testConfig: pageLoad.testConfig,
                    results: pageLoad.results,
                    overallAverage: pageLoad.overallAverage,
                    isDeleted: pageLoad.isDeleted,
                    createdAt: pageLoad.createdAt,
                    updatedAt: pageLoad.updatedAt
                });
                console.log(`PageLoadBenchmark ${mongoIdStr} added from MongoDB to MySQL`);
            } else if (new Date(pageLoad.updatedAt) > new Date(existingPageLoad.updatedAt)) {
                await PageLoadBenchmarkMySQL.update({
                    javascriptType: pageLoad.javascriptType,
                    testType: pageLoad.testType,
                    testConfig: pageLoad.testConfig,
                    results: pageLoad.results,
                    overallAverage: pageLoad.overallAverage,
                    isDeleted: pageLoad.isDeleted,
                    createdAt: pageLoad.createdAt,
                    updatedAt: pageLoad.updatedAt
                }, { where: { mongoId: mongoIdStr } });
                console.log(`PageLoadBenchmark ${mongoIdStr} updated from MongoDB to MySQL`);
            }
        }

        // Sync from MySQL to MongoDB
        const mysqlPageLoads = await PageLoadBenchmarkMySQL.findAll({ where: { isDeleted: false } });
        for (const pageLoad of mysqlPageLoads) {
            if (pageLoad.mongoId && isValidObjectId(pageLoad.mongoId)) {
                const existingPageLoad = await PageLoadBenchmarkMongo.findById(pageLoad.mongoId);
                if (!existingPageLoad) {
                    let newPageLoad = new PageLoadBenchmarkMongo({
                        _id: pageLoad.mongoId, // Use MySQL's mongoId to keep IDs consistent
                        javascriptType: pageLoad.javascriptType,
                        testType: pageLoad.testType,
                        testConfig: pageLoad.testConfig,
                        results: pageLoad.results,
                        overallAverage: pageLoad.overallAverage,
                        isDeleted: pageLoad.isDeleted,
                        createdAt: pageLoad.createdAt,
                        updatedAt: pageLoad.updatedAt
                    });
                    await newPageLoad.save();
                    console.log(`PageLoadBenchmark ${pageLoad.mongoId} added from MySQL to MongoDB`);
                } else if (new Date(pageLoad.updatedAt) > new Date(existingPageLoad.updatedAt)) {
                    await PageLoadBenchmarkMongo.findByIdAndUpdate(pageLoad.mongoId, {
                        javascriptType: pageLoad.javascriptType,
                        testType: pageLoad.testType,
                        testConfig: pageLoad.testConfig,
                        results: pageLoad.results,
                        overallAverage: pageLoad.overallAverage,
                        isDeleted: pageLoad.isDeleted,
                        createdAt: pageLoad.createdAt,
                        updatedAt: pageLoad.updatedAt
                    }, { new: true });
                    console.log(`PageLoadBenchmark ${pageLoad.mongoId} updated from MySQL to MongoDB`);
                }
            }
        }
    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncPageLoad };
