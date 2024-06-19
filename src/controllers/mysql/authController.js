const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/mysql/User');
const { checkDatabaseStatus } = require('../../config/handlers');
const UserMongo = require('../../models/mongo/User');

exports.register = async (req, res) => {
    const { fullName, username, email, password, role = 'user' } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            fullName,
            username,
            email,
            password: hashedPassword,
            role,
            isActive: true,
            createdAt: new Date(),
        });

        res.status(201).json({
            status: 201,
            message: 'User registered successfully in MySQL',
            data: newUser,
        });

        // Sinkronisasi ke MongoDB jika terkoneksi
        if (checkDatabaseStatus().mongoConnected) {
            await UserMongo.create({
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt,
            });
            console.log('Data synced to MongoDB successfully.');
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'User not found in MySQL' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
        }, process.env.JWT_KEY_SECRET, { expiresIn: '24h' });

        res.json({
            status: 200,
            message: 'Login successful',
            data: {
                token,
                user,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to login', error: error.message });
    }
};
exports.deleteUser = async (req, res) => {
    const { email } = req.body;

    try {
        const [updated] = await User.update(
            { isDeleted: true, updatedAt: new Date() },
            { where: { email } }
        );

        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User marked as deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
};