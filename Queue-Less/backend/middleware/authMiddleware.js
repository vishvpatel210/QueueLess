const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');

// Protect routes - verify JWT token in Authorization header
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
    });
  }
};

// Grant access to specific roles (supporting both SHOP_ADMIN/admin and CUSTOMER/customer)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action.',
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const allowedRoles = roles.map((r) => {
      const u = r.toUpperCase();
      if (u === 'ADMIN') return 'SHOP_ADMIN';
      return u;
    });

    const isMatch = allowedRoles.includes(userRole) || (userRole === 'ADMIN' && allowedRoles.includes('SHOP_ADMIN'));

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
