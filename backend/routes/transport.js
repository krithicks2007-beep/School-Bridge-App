const express = require('express');
const router = express.Router();
const { getStudentsWithTransport, upsertTransport, getStudentTransport } = require('../controllers/transportController');

// GET /api/transport?class_id=XXX
router.get('/', getStudentsWithTransport);

// GET /api/transport/:student_id
router.get('/:student_id', getStudentTransport);

// PUT /api/transport/:student_id
router.put('/:student_id', upsertTransport);

module.exports = router;
