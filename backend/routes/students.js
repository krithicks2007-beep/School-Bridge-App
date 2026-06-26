const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadPhoto } = require('../controllers/studentsController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:id/photo', upload.single('file'), uploadPhoto);

module.exports = router;
