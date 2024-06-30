const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MemoryBenchmarkSchema = new Schema({
    testType: {
        type: String,
        required: true
    },
    testCodes: {
        type: [String],
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
    averageMemoryUsage: {
        type: String
    },
    totalAverageMemoryUsage: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    javascriptType: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('MemoryBenchmark', MemoryBenchmarkSchema);
