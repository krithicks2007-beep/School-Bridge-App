const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { getTimetable, getTeacherSchedule, uploadTimetable, updateTimetableCell, getSubjectsByClass } = require('../controllers/timetableController');

router.get('/subjects/:class_id', getSubjectsByClass);
router.post('/teacher-schedule', getTeacherSchedule);
router.get('/', getTimetable);
router.post('/upload', upload.single('file'), uploadTimetable);
router.put('/:id', updateTimetableCell);

module.exports = router;
