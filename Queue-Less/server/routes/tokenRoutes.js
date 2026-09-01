const express = require('express');
const {
  getTokenById,
  getMyActiveTokens,
  cancelToken,
  skipToken,
  completeToken,
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/active', protect, getMyActiveTokens);
router.get('/:id', protect, getTokenById);
router.post('/:id/cancel', protect, cancelToken);

// Admin Token Actions
router.post('/:id/skip', protect, authorize('admin', 'SHOP_ADMIN'), skipToken);
router.post('/:id/complete', protect, authorize('admin', 'SHOP_ADMIN'), completeToken);

module.exports = router;
