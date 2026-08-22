const Service = require('../models/Service');
const Branch = require('../models/Branch');

// @desc    Get all active services for a branch
// @route   GET /api/branches/:branchId/services
// @access  Public
const getServicesByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const services = await Service.find({ branchId, isActive: true });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create service for branch
// @route   POST /api/branches/:branchId/services
// @access  Protected (Admin)
const createService = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { name, description, estimatedDurationMinutes, price, maxQueueCapacity, prefix } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service name',
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    const service = await Service.create({
      branchId,
      name,
      description: description || '',
      estimatedDurationMinutes: estimatedDurationMinutes || 15,
      price: price || 0,
      maxQueueCapacity: maxQueueCapacity || 100,
      prefix: prefix ? prefix.toUpperCase() : 'A',
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service details by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('branchId');
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServicesByBranch,
  createService,
  getServiceById,
};
