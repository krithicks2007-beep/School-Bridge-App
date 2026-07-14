const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');

router.post('/save', marksController.saveMarks);
router.get('/parent/:student_id', marksController.getParentMarks);
router.get('/teacher', marksController.getTeacherMarks);
router.get('/teacher/exams', marksController.getTeacherExams);
router.delete('/exam', marksController.deleteExamMarks);

module.exports = router;
