// src/routes/executionTimeRoutes.js
const express = require('express');
const router = express.Router();
const executionTimeController = require('../controllers/executionTimeController');

// Route to start benchmark
router.post('/start', executionTimeController.startBenchmark);

module.exports = router;
