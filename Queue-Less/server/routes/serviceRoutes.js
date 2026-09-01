const express = require('express');
const {
  getServicesByBranch,
  createService,
  getServiceById,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { verifyBranchOwnership, verifyServiceOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router({ mergeParams: true });

// Mounted at /api/branches/:branchId/services and /api/services
router.get('/', getServicesByBranch);
router.post('/', protect, authorize('admin', 'SHOP_ADMIN'), verifyBranchOwnership, createService);
router.get('/:id', getServiceById);
router.patch('/:id', protect, authorize('admin', 'SHOP_ADMIN'), verifyServiceOwnership, updateService);
router.delete('/:id', protect, authorize('admin', 'SHOP_ADMIN'), verifyServiceOwnership, deleteService);

module.exports = router;
