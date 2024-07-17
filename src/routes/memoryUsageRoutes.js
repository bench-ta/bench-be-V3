// src/routes/memoryUsageRoutes.js
const express = require('express');
const router = express.Router();
const mongoController = require('../controllers/mongo/memoryUsageController');
const mysqlController = require('../controllers/mysql/memoryUsageController');
const { checkDatabaseStatus } = require('../config/handlers');
const verifyToken = require('../middleware/auth');

const getController = async () => {
    const dbStatus = await checkDatabaseStatus();
    if (dbStatus.mongoConnected) {
        return mongoController; // Prefer MongoDB if connected
    } else if (dbStatus.mysqlConnected) {
        return mysqlController; // Fallback to MySQL if MongoDB is not available
    }
    throw new Error('No database connection available');
};

router.post('/start', async (req, res) => {
    try {
        const controller = await getController();
        await controller.startBenchmark(req, res);
    } catch (error) {
        console.error('Error in /start route:', error.message);
        res.status(500).json({ message: error.message });
    }
});
router.get('/getall',verifyToken, async (req, res) => {
    try {
        const controller = await getController();
        await controller.getUserBenchmarks(req, res);
    } catch (error) {
        console.error('Error in /user-benchmarks route:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
