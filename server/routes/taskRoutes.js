const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus, deleteTask, updateTask } = require('../controllers/taskController');
const authenticateToken = require('../middleware/authMiddleware');

// Permission checks live in the controller because they depend on the task's project:
// global Admins and project-level Admins manage tasks, assignees may update status.
router.get('/', authenticateToken, getTasks);
router.post('/', authenticateToken, createTask);
router.put('/:id/status', authenticateToken, updateTaskStatus);
router.put('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;
