const express = require('express');
const router = express.Router();
const { parentLogin, staffLogin } = require('../controllers/authController');

router.post('/parent-login', parentLogin);
router.post('/staff-login', staffLogin);

module.exports = router;
