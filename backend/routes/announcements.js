const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  createAnnouncement, 
  getAnnouncements,
  getSentAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementsController');

// GET /api/announcements/students
router.get('/students', getStudents);

// GET /api/announcements/sent/:author_id
router.get('/sent/:author_id', getSentAnnouncements);

// PUT /api/announcements/:id
router.put('/:id', updateAnnouncement);

// DELETE /api/announcements/:id
router.delete('/:id', deleteAnnouncement);

// POST /api/announcements
router.post('/', createAnnouncement);

// GET /api/announcements
router.get('/', getAnnouncements);

module.exports = router;
