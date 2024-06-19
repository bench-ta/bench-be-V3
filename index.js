require('dotenv').config();
const express = require('express');
const app = express();

// Import koneksi database
const { connectMongoDB } = require('./src/config/mongo');
const { connectMySQL } = require('./src/config/mysql');

// Import middleware sinkronisasi
const { syncData } = require('./src/middleware/sync');
const { syncExecutionTime } = require('./src/middleware/syncExecutionTime');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const executionTimeRoutes = require('./src/routes/executionTimeRoutes');

app.use(express.json());

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/execution-time', executionTimeRoutes);

const startServer = async () => {
    await connectMongoDB();
    await connectMySQL();

    // Sinkronisasi data ketika server dimulai
    await syncData();
    await syncExecutionTime();

    // Sinkronisasi data secara berkala setiap 20 detik
    setInterval(syncData, 20000); // 20000 ms = 20 detik
    setInterval(syncExecutionTime, 20000); // 20000 ms = 20 detik

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
