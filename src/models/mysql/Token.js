const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: { type: String, required: true },
  accessCount: { type: Number, default: 0 }
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;