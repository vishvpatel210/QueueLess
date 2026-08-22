const express = require('express');
const { getTokenById, cancelToken } = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', protect, getTokenById);
router.post('/:id/cancel', protect, cancelToken);

module.exports = router;
