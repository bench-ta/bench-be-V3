// controllers/mysql/aggregationController.js

const { Op } = require('sequelize');
const ExecutionTimeBenchmark = require('../../models/mysql/ExecutionTimeBenchmark');
const MemoryBenchmark = require('../../models/mysql/MemoryUsageBenchmark');
const PageLoadBenchmark = require('../../models/mysql/PageLoadBenchmark');
const AsyncPerformanceBenchmark = require('../../models/mysql/AsyncPerformanceBenchmark');

exports.aggregateJavaScriptTypes = async (req, res) => {
    try {
        const allModels = [ExecutionTimeBenchmark, MemoryBenchmark, PageLoadBenchmark, AsyncPerformanceBenchmark];
        
        const getCounts = async model => {
            const results = await model.findAll({
                attributes: ['javascriptType', [model.sequelize.fn('COUNT', model.sequelize.col('javascriptType')), 'count']],
                group: 'javascriptType',
                order: [[model.sequelize.literal('count'), 'DESC']]
            });

            return results.map(result => ({
                _id: result.dataValues.javascriptType,
                count: result.dataValues.count
            }));
        };

        const results = await Promise.all(allModels.map(getCounts));
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
