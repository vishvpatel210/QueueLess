const express = require('express');
const {
  registerUser,
  registerShopAdmin,
  loginUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/register/customer', registerUser);
router.post('/register-admin', registerShopAdmin);
router.post('/register/shop-admin', registerShopAdmin);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
