// src/models/mysql/PageLoadBenchmark.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql'); // Adjust the path as necessary

const PageLoadBenchmark = sequelize.define('PageLoadBenchmark', {
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
    overallAveragePageLoadTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    overallAverageMemoryUsage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    totalExecutionTime: {
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
    tableName: 'PageLoadBenchmarks',
    timestamps: false // Using manually managed timestamps
});

module.exports = PageLoadBenchmark;
