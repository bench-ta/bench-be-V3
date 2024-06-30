require('dotenv').config();
const express = require('express');
const app = express();

// Import koneksi database
const { connectMongoDB } = require('./src/config/mongo');
const { connectMySQL } = require('./src/config/mysql');

// Import middleware sinkronisasi
const { syncData } = require('./src/middleware/sync');
const { syncExecutionTime } = require('./src/middleware/syncExecutionTime');
const { syncMemoryUsage } = require('./src/middleware/syncMemoryUsage');
const { syncPageLoad } = require('./src/middleware/syncPageLoad');
const { syncAsyncPerformance } = require('./src/middleware/syncAsyncPerformance');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const executionTimeRoutes = require('./src/routes/executionTimeRoutes');
const memoryUsageRoutes = require('./src/routes/memoryUsageRoutes');
const pageLoadRoutes = require('./src/routes/pageLoadRoutes');
// const asyncPerformanceRoutes = require('./src/routes/asyncPerformanceRoutes');

app.use(express.json());

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/execution-time', executionTimeRoutes);
app.use('/api/memory-usage', memoryUsageRoutes);
app.use('/api/page-load', pageLoadRoutes);
// app.use('/api/async-performance', asyncPerformanceRoutes);

const startServer = async () => {
    await connectMongoDB();
    await connectMySQL();

    // Sinkronisasi data ketika server dimulai
    await syncData();
    await syncExecutionTime();
    await syncMemoryUsage();
    await syncPageLoad();
    // await syncAsyncPerformance();

    // Sinkronisasi data secara berkala setiap 20 detik
    setInterval(syncData, 20000); // 20000 ms = 20 detik
    setInterval(syncExecutionTime, 20000); // 20000 ms = 20 detik
    setInterval(syncMemoryUsage, 20000);
    setInterval(syncPageLoad, 20000);
    // setInterval(syncAsyncPerformance, 20000);


    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
