const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql', // Menyediakan dialect MySQL
    logging: console.log, // Optional: untuk logging query
});

async function connectMySQL() {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connected successfully!');
        return sequelize; // Kembali instance sequelize yang terkoneksi
    } catch (err) {
        console.error('❌ MySQL connection error:', err);
        return null;
    }
}

module.exports = { connectMySQL, sequelize };
