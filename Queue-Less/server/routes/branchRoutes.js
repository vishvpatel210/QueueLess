const express = require('express');
const { createBranch, getBranchById } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', getBranchById);
router.post('/', protect, authorize('admin'), createBranch);

module.exports = router;
