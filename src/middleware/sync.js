const UserMongo = require('../models/mongo/User');
const UserMySQL = require('../models/mysql/User');
const { checkDatabaseStatus } = require('../config/handlers');

const syncData = async () => {
    const status = await checkDatabaseStatus();
    
    if (status.mongoConnected && status.mysqlConnected) {
        console.log('Both databases are connected. Checking for synchronization.');

        // Sync from MySQL to MongoDB (ignoring deleted users)
        const mysqlUsers = await UserMySQL.findAll({ where: { isDeleted: false } });
        for (const user of mysqlUsers) {
            const existingUser = await UserMongo.findOne({ email: user.email });
            if (!existingUser || new Date(user.updatedAt) > new Date(existingUser.updatedAt)) {
                await UserMongo.findOneAndUpdate(
                    { email: user.email },
                    {
                        fullName: user.fullName,
                        username: user.username,
                        password: user.password,
                        role: user.role,
                        isActive: user.isActive,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        isDeleted: user.isDeleted
                    },
                    { upsert: true }
                );
                console.log(`User ${user.email} synced from MySQL to MongoDB`);
            }
        }

        // Sync from MongoDB to MySQL (ignoring deleted users)
        const mongoUsers = await UserMongo.find({ isDeleted: false });
        for (const user of mongoUsers) {
            const existingUser = await UserMySQL.findOne({ where: { email: user.email } });
            if (!existingUser || new Date(user.updatedAt) > new Date(existingUser.updatedAt)) {
                await UserMySQL.upsert({
                    fullName: user.fullName,
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    isDeleted: user.isDeleted
                });
                console.log(`User ${user.email} synced from MongoDB to MySQL`);
            }
        }

    } else {
        console.log('One or both databases are not connected. Skipping synchronization.');
    }
};

module.exports = { syncData };
