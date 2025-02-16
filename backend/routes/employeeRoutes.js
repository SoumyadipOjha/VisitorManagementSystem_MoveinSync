const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');

router.post('/register', employeeController.register);
router.post('/login', employeeController.login);
router.get('/', auth, employeeController.getAllEmployees);

module.exports = router;