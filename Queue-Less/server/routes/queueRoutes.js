const express = require('express');
const { getQueueStatus, joinQueue } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', getQueueStatus);
router.post('/:id/join', protect, joinQueue);

module.exports = router;
