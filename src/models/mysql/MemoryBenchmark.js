const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const MemoryBenchmark = sequelize.define('MemoryBenchmark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mongoId: {
        type: DataTypes.STRING(24),
        allowNull: true // MongoDB ObjectId akan disimpan sebagai string
    },
    testType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    testCodes: {
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
    averageMemoryUsage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    totalAverageMemoryUsage: {
        type: DataTypes.STRING,
        allowNull: true
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
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'MemoryBenchmarks',
    timestamps: false // Menggunakan timestamp manual
});

module.exports = MemoryBenchmark;
