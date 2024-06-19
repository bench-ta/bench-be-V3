const express = require('express');
const router = express.Router();
const { checkDatabaseStatus } = require('../config/handlers');
const mongoController = require('../controllers/mongo/authController');
const mysqlController = require('../controllers/mysql/authController');

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

router.post('/register', async (req, res) => {
    try {
        const controller = await getController();
        await controller.register(req, res);
    } catch (error) {
        console.error('Error in /register route:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const controller = await getController();
        await controller.login(req, res);
    } catch (error) {
        console.error('Error in /login route:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
