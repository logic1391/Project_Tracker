const express = require('express');
const router = express.Router();
const { getProjects, getProjectById, createProject, addMember, updateMemberRole, updateProject, deleteProject, removeMember } = require('../controllers/projectController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');
const authorizeProjectAdmin = require('../middleware/projectAccessMiddleware');

router.get('/', authenticateToken, getProjects);
router.get('/:id', authenticateToken, getProjectById);
// Creating and deleting projects is reserved for global Admins
router.post('/', authenticateToken, authorizeRole('Admin'), createProject);
router.delete('/:id', authenticateToken, authorizeRole('Admin'), deleteProject);
// Global Admins and project-level Admins manage a project's details and members
router.put('/:id', authenticateToken, authorizeProjectAdmin('id'), updateProject);
router.post('/:id/members', authenticateToken, authorizeProjectAdmin('id'), addMember);
router.put('/:id/members/:userId', authenticateToken, authorizeProjectAdmin('id'), updateMemberRole);
router.delete('/:id/members/:userId', authenticateToken, authorizeProjectAdmin('id'), removeMember);

module.exports = router;
