const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

module.exports = router;
