const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: process.env.MYSQL_PORT,
    logging: false,
});


const connectMySQL = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL');
        
        // Sinkronkan model ke database, membuat tabel jika belum ada
        await sequelize.sync({ alter: true });  // Menggunakan alter untuk menyesuaikan perubahan skema

        console.log('MySQL tables synchronized');
    } catch (error) {
        console.error('MySQL connection error:', error);
    }
};

module.exports = { connectMySQL, sequelize };
