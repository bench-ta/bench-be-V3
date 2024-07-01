// src/models/mysql/MemoryUsageBenchmark.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const MemoryUsageBenchmark = sequelize.define('MemoryUsageBenchmark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mongoId: {
        type: DataTypes.STRING(24),
        allowNull: true, // MongoDB ObjectId akan disimpan sebagai string
    },
    javascriptType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    testType: {
        type: DataTypes.STRING,
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
    overallAverage: {
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
    tableName: 'MemoryUsageBenchmarks',
    timestamps: false // Menggunakan timestamp manual
});

module.exports = MemoryUsageBenchmark;
