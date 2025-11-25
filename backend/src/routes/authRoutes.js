const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/authenticate', authController.authenticate);
router.get('/user/:userId', authController.getUser);
router.put('/user/:userId/progress', authController.updateProgress);

module.exports = router;
