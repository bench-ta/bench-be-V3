const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserMongo = require('../models/mongo/User');
const UserMySQL = require('../models/mysql/User');
const { checkDatabaseStatus } = require('../config/handlers');

exports.register = async (req, res) => {
    const { fullName, username, email, password, role = 'user' } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdAt = new Date();
        const updatedAt = createdAt;

        const dbStatus = await checkDatabaseStatus();
        
        // Simpan ke MongoDB
        if (dbStatus.mongoConnected) {
            const newUserMongo = new UserMongo({
                fullName,
                username,
                email,
                password: hashedPassword,
                role,
                isActive: true,
                createdAt,
                updatedAt
            });
            await newUserMongo.save();
            console.log('User registered in MongoDB');
        }

        // Simpan ke MySQL
        if (dbStatus.mysqlConnected) {
            await UserMySQL.create({
                fullName,
                username,
                email,
                password: hashedPassword,
                role,
                isActive: true,
                createdAt,
                updatedAt
            });
            console.log('User registered in MySQL');
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
};
