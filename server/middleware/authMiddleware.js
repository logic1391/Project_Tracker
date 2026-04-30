const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = 'your_super_secret_key_123'; // In a real app, use process.env.JWT_SECRET

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = await User.findByPk(verified.id);
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid Token' });
  }
};

module.exports = authenticateToken;
