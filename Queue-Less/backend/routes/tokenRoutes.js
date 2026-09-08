const express = require('express');
const {
  getTokenById,
  getMyActiveTokens,
  getMyTokenHistory,
  cancelToken,
  skipToken,
  completeToken,
  startTokenService,
  noShowToken,
  submitReview,
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Customer routes (order matters — specific before :id)
router.get('/active', protect, authorize('CUSTOMER'), getMyActiveTokens);
router.get('/history', protect, authorize('CUSTOMER'), getMyTokenHistory);
router.get('/:id', protect, getTokenById);
router.post('/:id/cancel', protect, authorize('CUSTOMER'), cancelToken);
router.post('/:id/review', protect, authorize('CUSTOMER'), submitReview);

// Admin token actions
router.post('/:id/skip', protect, authorize('SHOP_ADMIN'), skipToken);
router.post('/:id/complete', protect, authorize('SHOP_ADMIN'), completeToken);
router.post('/:id/start', protect, authorize('SHOP_ADMIN'), startTokenService);
router.post('/:id/no-show', protect, authorize('SHOP_ADMIN'), noShowToken);

module.exports = router;
