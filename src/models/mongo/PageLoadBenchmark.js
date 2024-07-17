// src/models/mongo/PageLoadBenchmark.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PageLoadBenchmarkSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
    javascriptType: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        required: true
    },
    testConfig: {
        type: Object,
        required: true
    },
    results: {
        type: Array,
        required: true
    },
    overallAveragePageLoadTime: {
        type: String,
        required: true
    },
    overallAverageMemoryUsage: {
        type: String,
        required: true
    },
    totalExecutionTime: {
        type: String,
        required: true
    },
    totalMemoryUsage: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('PageLoadBenchmark', PageLoadBenchmarkSchema);
