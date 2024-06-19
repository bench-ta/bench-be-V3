const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

const mongoURI = process.env.MONGO_URI;
const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: "",
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
};


const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: process.env.MYSQL_PORT,
});


const connectMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('MongoDB connection error:', error);
    }
};

const connectMySQL = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL');
    } catch (error) {
        console.log('MySQL connection error:', error);
    }
};

module.exports = { connectMongoDB, connectMySQL, sequelize, mongoose };
