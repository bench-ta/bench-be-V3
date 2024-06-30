const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const AsyncPerformanceBenchmark = sequelize.define('AsyncPerformanceBenchmark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mongoId: {
        type: DataTypes.STRING(24),
        allowNull: true, // MongoDB ObjectId akan disimpan sebagai string
    },
    testType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    testCode: {
        type: DataTypes.JSON,
        allowNull: false
    },
    testConfig: {
        type: DataTypes.JSON,
        allowNull: false
    },
    results: {
        type: DataTypes.JSON,
        allowNull: false
    },
    averageAsyncExecution: {
        type: DataTypes.FLOAT
    },
    totalAverageAsyncExecution: {
        type: DataTypes.STRING
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    javascriptType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'AsyncPerformanceBenchmarks',
    timestamps: false // Menggunakan timestamp manual
});

module.exports = AsyncPerformanceBenchmark;
