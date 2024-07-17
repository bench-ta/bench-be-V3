// src/routes/executionTimeRoutes.js

const express = require('express');
const router = express.Router();
const mongoController = require('../controllers/mongo/executionTimeController');
const mysqlController = require('../controllers/mysql/executionTimeController');
const { checkDatabaseStatus } = require('../config/handlers');
const verifyToken = require('../middleware/auth');

const getController = async () => {
    const dbStatus = await checkDatabaseStatus();
    if (dbStatus.mongoConnected) {
        return mongoController; // MongoDB sebagai default jika terhubung
    } else if (dbStatus.mysqlConnected) {
        return mysqlController;
    }
    throw new Error('No database connection available');
};

router.post('/start',verifyToken, async (req, res) => {
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
