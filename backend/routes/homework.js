const express = require('express');
const router = express.Router();
const { postHomework, getClassHomework, getTeacherHomework } = require('../controllers/homeworkController');

router.post('/', postHomework);
router.get('/class/:class_id', getClassHomework);
router.get('/teacher/:teacher_id', getTeacherHomework);

module.exports = router;
