const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus, deleteTask, updateTask } = require('../controllers/taskController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.get('/', authenticateToken, getTasks);
// Only Admins can create tasks
router.post('/', authenticateToken, authorizeRole('Admin'), createTask);
// Members and Admins can update task status
router.put('/:id/status', authenticateToken, updateTaskStatus);
// Only Admins can fully edit a task
router.put('/:id', authenticateToken, authorizeRole('Admin'), updateTask);
router.delete('/:id', authenticateToken, authorizeRole('Admin'), deleteTask);

module.exports = router;
