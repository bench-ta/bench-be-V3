const { mongoose } = require('./mongo');
const { sequelize } = require('./mysql');

const checkDatabaseStatus = async () => {
    const mongoConnected = mongoose.connection.readyState === 1;
    const mysqlConnected = await sequelize.authenticate().then(() => true).catch(() => false);

    console.log('MongoDB Connected:', mongoConnected);
    console.log('MySQL Connected:', mysqlConnected);

    return {
        mongoConnected,
        mysqlConnected,
    };
};

module.exports = { checkDatabaseStatus };
