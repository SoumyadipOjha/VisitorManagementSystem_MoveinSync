const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/', upload.single('photo'), visitorController.registerVisitor);
router.put('/:id/status', auth, visitorController.updateStatus);
router.get('/', auth, visitorController.getVisitors);

module.exports = router;