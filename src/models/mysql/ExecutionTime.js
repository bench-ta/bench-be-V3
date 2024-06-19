// src/models/mysql/ExecutionTime.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const ExecutionTime = sequelize.define('ExecutionTime', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    tableName: 'ExecutionTimes',
    timestamps: false // Using manually managed timestamps
});

module.exports = ExecutionTime;
