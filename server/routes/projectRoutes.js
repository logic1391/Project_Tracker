const express = require('express');
const router = express.Router();
const { getProjects, getProjectById, createProject, addMember, updateProject, deleteProject, removeMember } = require('../controllers/projectController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.get('/', authenticateToken, getProjects);
router.get('/:id', authenticateToken, getProjectById);
router.post('/', authenticateToken, authorizeRole('Admin'), createProject);
router.post('/:id/members', authenticateToken, authorizeRole('Admin'), addMember);
router.delete('/:id/members/:userId', authenticateToken, authorizeRole('Admin'), removeMember);
router.put('/:id', authenticateToken, authorizeRole('Admin'), updateProject);
router.delete('/:id', authenticateToken, authorizeRole('Admin'), deleteProject);

module.exports = router;
