const mongoose = require('mongoose');

async function connectMongoDB() {
    const dbURI = process.env.MONGO_URI;
    try {
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully!');
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        return false;
    }
}

module.exports = connectMongoDB;
