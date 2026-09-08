const express = require('express');
const router = express.Router();
const {
  getQueueAnalytics,
  getBranchAnalytics,
  getBusinessLeaderboard,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All analytics routes are admin-only
router.use(protect);
router.use(authorize('admin', 'business_owner'));

// Queue-level analytics
router.get('/queue/:queueId', getQueueAnalytics);

// Branch-level analytics (last N days)
router.get('/branch/:branchId', getBranchAnalytics);

// Business leaderboard
router.get('/business/:businessId/leaderboard', getBusinessLeaderboard);

module.exports = router;
