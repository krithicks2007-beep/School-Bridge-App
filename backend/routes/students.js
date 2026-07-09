const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadPhoto, createStudent, searchStudents, getStudent, updateStudent, deleteStudent } = require('../controllers/studentsController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:id/photo', upload.single('file'), uploadPhoto);
router.post('/', createStudent);
router.get('/', searchStudents);
router.get('/:id', getStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
