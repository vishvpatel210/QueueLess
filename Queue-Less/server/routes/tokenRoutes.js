const express = require('express');
const {
  getTokenById,
  cancelToken,
  skipToken,
  completeToken,
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', protect, getTokenById);
router.post('/:id/cancel', protect, cancelToken);

// Admin Token Actions
router.post('/:id/skip', protect, authorize('admin'), skipToken);
router.post('/:id/complete', protect, authorize('admin'), completeToken);

module.exports = router;
