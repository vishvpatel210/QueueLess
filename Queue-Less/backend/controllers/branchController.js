const Branch = require('../models/Branch');
const Business = require('../models/Business');

// @desc    Get all registered branches with business details & GPS coordinates
// @route   GET /api/branches
// @access  Public
const getAllBranches = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let businessQuery = {};
    if (category && category !== 'All') {
      businessQuery.category = category;
    }
    if (search) {
      businessQuery.name = { $regex: search, $options: 'i' };
    }

    // Find businesses matching filter
    const matchingBusinesses = await Business.find(businessQuery).select('_id');
    const businessIds = matchingBusinesses.map((b) => b._id);

    // Find active branches belonging to matching businesses
    const branches = await Branch.find({
      businessId: { $in: businessIds },
      isActive: true,
    }).populate('businessId', 'name description category rating reviewCount logoUrl');

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create branch for business
// @route   POST /api/branches or POST /api/businesses/:businessId/branches
// @access  Protected (Admin)
const createBranch = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.body.businessId;
    const {
      name,
      address,
      city,
      state,
      pincode,
      landmark,
      coordinates, // [lng, lat]
      latitude,
      longitude,
      operatingHours,
      phone,
      email,
      website,
    } = req.body;

    if (!businessId || !name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId, branch name, and address',
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    if (business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own this business',
      });
    }

    let finalCoords = [72.8777, 19.0760]; // [lng, lat]
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      finalCoords = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];
    } else if (latitude !== undefined && longitude !== undefined) {
      finalCoords = [parseFloat(longitude), parseFloat(latitude)];
    }

    const branch = await Branch.create({
      businessId,
      name: name.trim(),
      address: address.trim(),
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      location: {
        type: 'Point',
        coordinates: finalCoords,
      },
      operatingHours: operatingHours || { open: '09:00', close: '18:00' },
      phone: phone ? phone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      website: website ? website.trim() : '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single branch details
// @route   GET /api/branches/:id
// @access  Public
const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('businessId');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get branches for a business
// @route   GET /api/businesses/:businessId/branches
// @access  Public
const getBranchesByBusiness = async (req, res, next) => {
  try {
    const branches = await Branch.find({
      businessId: req.params.businessId,
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

// @desc    Update branch
// @route   PATCH /api/branches/:id
// @access  Protected (Admin / Owner)
const updateBranch = async (req, res, next) => {
  try {
    const branch = req.branch || (await Branch.findById(req.params.id));
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const {
      name,
      address,
      city,
      state,
      pincode,
      landmark,
      coordinates,
      latitude,
      longitude,
      operatingHours,
      phone,
      email,
      website,
      isActive,
    } = req.body;

    if (name) branch.name = name.trim();
    if (address) branch.address = address.trim();
    if (city !== undefined) branch.city = city.trim();
    if (state !== undefined) branch.state = state.trim();
    if (pincode !== undefined) branch.pincode = pincode.trim();
    if (landmark !== undefined) branch.landmark = landmark.trim();
    if (operatingHours) branch.operatingHours = operatingHours;
    if (phone !== undefined) branch.phone = phone.trim();
    if (email !== undefined) branch.email = email.trim().toLowerCase();
    if (website !== undefined) branch.website = website.trim();
    if (isActive !== undefined) branch.isActive = isActive;

    if (Array.isArray(coordinates) && coordinates.length === 2) {
      branch.location = {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      };
    } else if (latitude !== undefined && longitude !== undefined) {
      branch.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await branch.save();

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBranches,
  createBranch,
  getBranchById,
  getBranchesByBusiness,
  updateBranch,
};
