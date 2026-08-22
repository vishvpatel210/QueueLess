const express = require('express');
const {
  getBusinesses,
  getNearbyBusinesses,
  getBusinessById,
  createBusiness,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getBusinesses);
router.get('/nearby', getNearbyBusinesses);
router.get('/:id', getBusinessById);
router.post('/', protect, authorize('admin'), createBusiness);

module.exports = router;
