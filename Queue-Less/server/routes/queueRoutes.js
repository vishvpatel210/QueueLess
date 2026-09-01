const express = require('express');
const {
  getQueueStatus,
  getQueueTokens,
  joinQueue,
  callNext,
  pauseQueue,
  resumeQueue,
  closeQueue,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', getQueueStatus);
router.get('/:id/tokens', protect, authorize('admin', 'SHOP_ADMIN'), getQueueTokens);
router.post('/:id/join', protect, joinQueue);

// Admin Queue Actions
router.post('/:id/next', protect, authorize('admin', 'SHOP_ADMIN'), callNext);
router.post('/:id/pause', protect, authorize('admin', 'SHOP_ADMIN'), pauseQueue);
router.post('/:id/resume', protect, authorize('admin', 'SHOP_ADMIN'), resumeQueue);
router.post('/:id/close', protect, authorize('admin', 'SHOP_ADMIN'), closeQueue);

module.exports = router;
