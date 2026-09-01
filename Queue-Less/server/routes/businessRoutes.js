const {
  getBusinesses,
  getNearbyBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  getMyBusinesses,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { verifyBusinessOwnership } = require('../middleware/ownershipMiddleware');

const {
  getBranchesByBusiness,
  createBranch,
} = require('../controllers/branchController');

const router = express.Router();

router.get('/', getBusinesses);
router.get('/nearby', getNearbyBusinesses);
router.get('/me/admin', protect, authorize('admin', 'SHOP_ADMIN'), getMyBusinesses);
router.get('/:id', getBusinessById);
router.post('/', protect, authorize('admin', 'SHOP_ADMIN'), createBusiness);
router.patch('/:id', protect, authorize('admin', 'SHOP_ADMIN'), verifyBusinessOwnership, updateBusiness);
router.get('/:businessId/branches', getBranchesByBusiness);
router.post('/:businessId/branches', protect, authorize('admin', 'SHOP_ADMIN'), verifyBusinessOwnership, createBranch);

module.exports = router;
