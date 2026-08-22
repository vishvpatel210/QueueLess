const express = require('express');
const {
  getServicesByBranch,
  createService,
  getServiceById,
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.get('/', getServicesByBranch);
router.post('/', protect, authorize('admin'), createService);

module.exports = router;
