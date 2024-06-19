const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Kolom isDeleted untuk soft delete
    },
}, {
    tableName: 'Users',
    timestamps: false,
    hooks: {
        beforeSave: (user) => {
            user.updatedAt = new Date();
        }
    }
});

module.exports = User;
