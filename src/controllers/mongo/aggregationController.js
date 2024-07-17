// controllers/mongo/aggregationController.js

const mongoose = require('mongoose');
const Benchmark = mongoose.model('ExecutionTimeBenchmark');
const MemoryBenchmark = mongoose.model('MemoryUsageBenchmark');
const PageLoadBenchmark = mongoose.model('PageLoadBenchmark');
const AsyncPerformanceBenchmark = mongoose.model('AsyncPerformanceBenchmark');

exports.aggregateJavaScriptTypes = async (req, res) => {
    try {
        const allCollections = [Benchmark, MemoryBenchmark, PageLoadBenchmark, AsyncPerformanceBenchmark];
        
        const getCounts = model => {
            return model.aggregate([
                {
                    $group: {
                        _id: "$javascriptType",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } } 
            ]);
        };

        const results = await Promise.all(allCollections.map(getCounts));
        const combinedResults = results.flat().reduce((acc, cur) => {
            acc[cur._id] = (acc[cur._id] || 0) + cur.count;
            return acc;
        }, {});

        const topResults = Object.entries(combinedResults)
            .map(([type, count]) => ({ javascriptType: type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6); 

        res.status(200).json({
            success: true,
            data: topResults
        });
    } catch (error) {
        console.error('Error during aggregation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
