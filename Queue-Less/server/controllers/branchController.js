const Branch = require('../models/Branch');
const Business = require('../models/Business');

// @desc    Create branch for business
// @route   POST /api/branches
// @access  Protected (Admin)
const createBranch = async (req, res, next) => {
  try {
    const { businessId, name, address, coordinates, operatingHours, phone } = req.body;

    if (!businessId || !name || !address || !coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId, name, address, and coordinates [lng, lat]',
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const branch = await Branch.create({
      businessId,
      name,
      address,
      location: {
        type: 'Point',
        coordinates: coordinates, // [lng, lat]
      },
      operatingHours: operatingHours || { open: '09:00', close: '18:00' },
      phone: phone || '',
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

module.exports = {
  createBranch,
  getBranchById,
};
