const mongoose = require('mongoose');

const AsyncPerformanceBenchmarkSchema = new mongoose.Schema({
  testType: {
    type: String,
    required: true,
  },
  testCode: {
    type: [String],
    required: true,
  },
  testConfig: {
    type: Object,
    required: true,
  },
  results: {
    type: Array,
    required: true,
  },
  averageAsyncExecution: {
    type: Number,
  },
  totalAverageAsyncExecution: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
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

const AsyncPerformanceBenchmark = mongoose.model('AsyncPerformanceBenchmark', AsyncPerformanceBenchmarkSchema);

module.exports = AsyncPerformanceBenchmark;
