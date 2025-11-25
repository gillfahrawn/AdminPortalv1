const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/users', dataController.getAllUsers);

module.exports = router;
