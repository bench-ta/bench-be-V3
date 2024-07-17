// src/models/mysql/MemoryUsageBenchmark.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql'); // Adjust the path as necessary

const MemoryUsageBenchmark = sequelize.define('MemoryUsageBenchmark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mongoId: {
        type: DataTypes.STRING(24),
        allowNull: true, // This will store the MongoDB _id as a string
        defaultValue: null
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
    totalMemoryUsage: {
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
    timestamps: false // Using manually managed timestamps
});

module.exports = MemoryUsageBenchmark;
