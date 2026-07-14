const express = require('express');
const router = express.Router();
const { postHomework, getClassHomework, getTeacherHomework, updateHomework, deleteHomework } = require('../controllers/homeworkController');

router.post('/', postHomework);
router.get('/class/:class_id', getClassHomework);
router.get('/teacher/:teacher_id', getTeacherHomework);
router.put('/:id', updateHomework);
router.delete('/:id', deleteHomework);

module.exports = router;
