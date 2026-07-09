const express = require('express');
const router = express.Router();
const { addTeacher, getTeacher, updateTeacher, deleteTeacher, searchTeachers } = require('../controllers/teachersController');

router.post('/add', addTeacher);
router.get('/', searchTeachers);
router.get('/:reg_id', getTeacher);
router.put('/update/:id', updateTeacher);
router.delete('/delete/:id', deleteTeacher);

module.exports = router;
