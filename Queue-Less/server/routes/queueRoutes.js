const express = require('express');
const {
  getQueueStatus,
  getQueueTokens,
  joinQueue,
  callNext,
  startService,
  noShowCustomer,
  pauseQueue,
  resumeQueue,
  closeQueue,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public — anyone can check queue status
router.get('/:id', getQueueStatus);

// Customer — join queue
router.post('/:id/join', protect, authorize('CUSTOMER'), joinQueue);

// Admin — queue token management
router.get('/:id/tokens', protect, authorize('SHOP_ADMIN'), getQueueTokens);
router.post('/:id/next', protect, authorize('SHOP_ADMIN'), callNext);
router.post('/:id/pause', protect, authorize('SHOP_ADMIN'), pauseQueue);
router.post('/:id/resume', protect, authorize('SHOP_ADMIN'), resumeQueue);
router.post('/:id/close', protect, authorize('SHOP_ADMIN'), closeQueue);

// Admin — per-token actions (nested under queue)
router.post('/:id/tokens/:tokenId/start', protect, authorize('SHOP_ADMIN'), startService);
router.post('/:id/tokens/:tokenId/no-show', protect, authorize('SHOP_ADMIN'), noShowCustomer);

module.exports = router;
