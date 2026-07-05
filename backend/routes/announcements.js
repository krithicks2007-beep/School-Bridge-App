const express = require('express');
const router = express.Router();
const { getStudents, createAnnouncement, getAnnouncements } = require('../controllers/announcementsController');

// GET /api/announcements/students
router.get('/students', getStudents);

// POST /api/announcements
router.post('/', createAnnouncement);

// GET /api/announcements
router.get('/', getAnnouncements);

module.exports = router;
