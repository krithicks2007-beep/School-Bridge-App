const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { getTimetable, uploadTimetable, updateTimetableCell } = require('../controllers/timetableController');

router.get('/', getTimetable);
router.post('/upload', upload.single('file'), uploadTimetable);
router.put('/:id', updateTimetableCell);

module.exports = router;
