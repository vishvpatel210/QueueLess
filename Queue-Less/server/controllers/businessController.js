const Business = require('../models/Business');
const Branch = require('../models/Branch');

// @desc    Get all businesses with optional category filter and search term
// @route   GET /api/businesses
// @access  Public
const getBusinesses = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const businesses = await Business.find(query).populate('ownerId', 'name email');
    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby businesses based on lat/lng coordinates
// @route   GET /api/businesses/nearby
// @access  Public
const getNearbyBusinesses = async (req, res, next) => {
  try {
    const { lat, lng, maxDistanceKm = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lat and lng query parameters',
      });
    }

    const maxDistanceMeters = parseFloat(maxDistanceKm) * 1000;

    const branches = await Branch.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isActive: true,
    }).populate('businessId');

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single business by ID with branches
// @route   GET /api/businesses/:id
// @access  Public
const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('ownerId', 'name email');
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const branches = await Branch.find({ businessId: business._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        ...business.toObject(),
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new business
// @route   POST /api/businesses
// @access  Protected (Admin)
const createBusiness = async (req, res, next) => {
  try {
    const { name, description, category, logoUrl } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business name and category',
      });
    }

    const business = await Business.create({
      name,
      description: description || '',
      category,
      logoUrl: logoUrl || '',
      ownerId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinesses,
  getNearbyBusinesses,
  getBusinessById,
  createBusiness,
};
