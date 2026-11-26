const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');

const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // The very first account bootstraps the workspace as Admin; everyone else
    // signs up as a Member and is promoted by an Admin from the Team page.
    // The role sent by the client (if any) is deliberately ignored.
    const newUser = await sequelize.transaction(async (transaction) => {
      const userCount = await User.count({ transaction });
      return User.create({
        name: String(name).trim(),
        email,
        password: password_hash,
        role: userCount === 0 ? 'Admin' : 'Member'
      }, { transaction });
    });

    res.status(201).json({ message: 'User created successfully', user: publicUser(newUser) });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns the current user, so the client can pick up role changes made by an Admin
const me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};

module.exports = { register, login, me };
