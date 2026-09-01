const User = require('../models/User');
const Business = require('../models/Business');
const Branch = require('../models/Branch');

// Email regex pattern for validation
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// @desc    Register a new CUSTOMER user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Check if email is already registered
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    // Server-enforced CUSTOMER role
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      phone: phone ? phone.trim() : '',
      role: 'CUSTOMER',
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'CUSTOMER',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const Service = require('../models/Service');
const Queue = require('../models/Queue');

// @desc    Register a new SHOP_ADMIN user with business, branch, operating hours & services details
// @route   POST /api/auth/register-admin
// @access  Public
const registerShopAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      businessName,
      category,
      description,
      website,
      businessPhone,
      businessEmail,
      branchName,
      address,
      city,
      state,
      pincode,
      landmark,
      latitude,
      longitude,
      operatingHours,
      services, // optional array of custom services: [{ name, description, estimatedDurationMinutes, price, prefix }]
    } = req.body;

    // Validate Admin Info
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter admin full name.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Validate Business Info
    if (!businessName || !businessName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter business name.',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please select a business category.',
      });
    }

    if (!branchName || !branchName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter branch name.',
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter branch address.',
      });
    }

    // Check unique email
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    // Server-enforced SHOP_ADMIN role
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      phone: phone ? phone.trim() : '',
      role: 'SHOP_ADMIN',
    });

    // Create Associated Business
    const business = await Business.create({
      name: businessName.trim(),
      category: category,
      ownerId: user._id,
      description: description ? description.trim() : `Registered business by ${user.name}`,
      website: website ? website.trim() : '',
      phone: businessPhone ? businessPhone.trim() : (phone ? phone.trim() : ''),
      email: businessEmail ? businessEmail.trim().toLowerCase() : cleanEmail,
      status: 'ACTIVE',
    });

    // Parse coordinates or fallback to default
    const lat = latitude !== undefined && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : 19.0760;
    const lng = longitude !== undefined && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : 72.8777;

    // Create Associated Branch with 2dsphere location
    const branch = await Branch.create({
      businessId: business._id,
      name: branchName.trim(),
      address: address.trim(),
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      operatingHours: operatingHours || { open: '09:00', close: '18:00' },
      phone: phone ? phone.trim() : '',
      email: cleanEmail,
      website: website ? website.trim() : '',
      isActive: true,
    });

    // Optional: create initial services & auto-open today's queues
    const createdServices = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        if (s.name && s.name.trim()) {
          const newService = await Service.create({
            branchId: branch._id,
            name: s.name.trim(),
            description: s.description || '',
            estimatedDurationMinutes: parseInt(s.estimatedDurationMinutes, 10) || 15,
            price: parseFloat(s.price) || 0,
            prefix: s.prefix ? s.prefix.trim().toUpperCase() : 'A',
            isActive: true,
          });

          await Queue.create({
            branchId: branch._id,
            serviceId: newService._id,
            date: todayStr,
            status: 'OPEN',
          });

          createdServices.push(newService);
        }
      }
    }

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'SHOP_ADMIN',
        createdAt: user.createdAt,
      },
      business: {
        id: business._id,
        name: business.name,
        category: business.category,
        status: business.status,
      },
      branch: {
        id: branch._id,
        name: branch.name,
        address: branch.address,
        location: branch.location,
      },
      services: createdServices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token with normalized role
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user and include passwordHash
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Normalize role format to upper case (CUSTOMER or SHOP_ADMIN)
    const normalizedRole =
      user.role === 'admin' || user.role === 'SHOP_ADMIN' ? 'SHOP_ADMIN' : 'CUSTOMER';

    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: normalizedRole,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Protected
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const normalizedRole =
      user.role === 'admin' || user.role === 'SHOP_ADMIN' ? 'SHOP_ADMIN' : 'CUSTOMER';

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: normalizedRole,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  registerShopAdmin,
  loginUser,
  getMe,
};
