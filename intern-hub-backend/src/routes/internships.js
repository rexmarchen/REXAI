const express = require('express');
const { getInternships } = require('../controllers/internshipsController');

const router = express.Router();

router.get('/', getInternships);

module.exports = router;