const express = require('express');
const {
  getQueueStatus,
  joinQueue,
  callNext,
  pauseQueue,
  resumeQueue,
  closeQueue,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', getQueueStatus);
router.post('/:id/join', protect, joinQueue);

// Admin Queue Actions
router.post('/:id/next', protect, authorize('admin'), callNext);
router.post('/:id/pause', protect, authorize('admin'), pauseQueue);
router.post('/:id/resume', protect, authorize('admin'), resumeQueue);
router.post('/:id/close', protect, authorize('admin'), closeQueue);

module.exports = router;
