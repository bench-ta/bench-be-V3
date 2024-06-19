const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config(); 

const verifyToken = (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: "Wahh Token Mu Tidak ada ni" });
  }

  const tokenParts = token.split('|');
  if (tokenParts.length === 2 && !isNaN(tokenParts[0])) {
    token = tokenParts[1];
  }

  jwt.verify(token, process.env.JWT_KEY_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Wahh Token Mu Sudah Habis atau tidak ada" });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
