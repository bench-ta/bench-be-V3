// src/models/mysql/ExecutionTimeBenchmark.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const ExecutionTimeBenchmark = sequelize.define('ExecutionTimeBenchmark', {
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
        allowNull: true || 0 
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
    totalExecutionTime: {  
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
    tableName: 'ExecutionTimeBenchmarks',
    timestamps: false 
});

module.exports = ExecutionTimeBenchmark;
