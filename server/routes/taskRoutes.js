const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.get('/', authenticateToken, getTasks);
// Only Admins can create tasks
router.post('/', authenticateToken, authorizeRole('Admin'), createTask);
// Members and Admins can update task status
router.put('/:id/status', authenticateToken, updateTaskStatus);
router.delete('/:id', authenticateToken, authorizeRole('Admin'), deleteTask);

module.exports = router;
