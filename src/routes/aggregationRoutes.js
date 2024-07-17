const express = require('express');
const router = express.Router();
const { checkDatabaseStatus } = require('../config/handlers');
const mongoController = require('../controllers/mongo/aggregationController');
const mysqlController = require('../controllers/mysql/aggregationController');

const getController = async () => {
    const dbStatus = await checkDatabaseStatus();
    console.log('Database Status:', dbStatus);

    if (dbStatus.mongoConnected) {
        return mongoController;
    } else if (dbStatus.mysqlConnected) {
        return mysqlController;
    }
    throw new Error('No database connection available');
};

router.get('/', async (req, res) => {
    try {
        const controller = await getController();
        await controller.aggregateJavaScriptTypes(req, res);
    } catch (error) {
        console.error('Error in /aggregateJavaScriptTypes route:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
