const express = require('express');
const {
  getAllBranches,
  createBranch,
  getBranchById,
  updateBranch,
} = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { verifyBranchOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router();

router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', protect, authorize('admin', 'SHOP_ADMIN'), createBranch);
router.patch('/:id', protect, authorize('admin', 'SHOP_ADMIN'), verifyBranchOwnership, updateBranch);

module.exports = router;
