const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.get('/', authenticateToken, authorizeRole('Admin'), getUsers);
router.put('/:id/role', authenticateToken, authorizeRole('Admin'), updateUserRole);

module.exports = router;
