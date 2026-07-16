const express = require('express');
const router = express.Router();
const { login, savePushToken } = require('../controllers/authController');

router.post('/login', login);
router.post('/push-token', savePushToken);

module.exports = router;
