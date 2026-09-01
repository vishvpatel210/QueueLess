const Service = require('../models/Service');
const Branch = require('../models/Branch');
const Queue = require('../models/Queue');
const Token = require('../models/Token');

// @desc    Get all active services for a branch with today's live queue status
// @route   GET /api/branches/:branchId/services
// @access  Public
const getServicesByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const services = await Service.find({ branchId, isActive: true });
    const todayStr = new Date().toISOString().split('T')[0];

    const servicesWithQueues = await Promise.all(
      services.map(async (service) => {
        let queue = await Queue.findOne({
          serviceId: service._id,
          date: todayStr,
        });

        let waitingCount = 0;
        if (queue) {
          waitingCount = await Token.countDocuments({
            queueId: queue._id,
            status: 'WAITING',
          });
        }

        return {
          ...service.toObject(),
          queue: queue ? { ...queue.toObject(), waitingCount } : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: servicesWithQueues.length,
      data: servicesWithQueues,
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
      name: name.trim(),
      description: description || '',
      estimatedDurationMinutes: estimatedDurationMinutes || 15,
      price: price || 0,
      maxQueueCapacity: maxQueueCapacity || 100,
      prefix: prefix ? prefix.toUpperCase() : 'A',
      isActive: true,
    });

    // Auto-create today's open queue for this service
    const todayStr = new Date().toISOString().split('T')[0];
    let queue = await Queue.findOne({ branchId, serviceId: service._id, date: todayStr });
    if (!queue) {
      queue = await Queue.create({
        branchId,
        serviceId: service._id,
        date: todayStr,
        status: 'OPEN',
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...service.toObject(),
        queue: queue.toObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service details by ID with today's live queue status
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

    const todayStr = new Date().toISOString().split('T')[0];
    let queue = await Queue.findOne({
      serviceId: service._id,
      date: todayStr,
    });

    if (!queue) {
      queue = await Queue.create({
        branchId: service.branchId?._id || service.branchId,
        serviceId: service._id,
        date: todayStr,
        status: 'OPEN',
      });
    }

    const waitingCount = await Token.countDocuments({
      queueId: queue._id,
      status: 'WAITING',
    });

    res.status(200).json({
      success: true,
      data: {
        ...service.toObject(),
        queue: {
          ...queue.toObject(),
          waitingCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service details
// @route   PATCH /api/services/:id
// @access  Protected (Admin / Owner)
const updateService = async (req, res, next) => {
  try {
    const service = req.service || (await Service.findById(req.params.id));
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { name, description, estimatedDurationMinutes, price, maxQueueCapacity, prefix, isActive } = req.body;

    if (name) service.name = name.trim();
    if (description !== undefined) service.description = description.trim();
    if (estimatedDurationMinutes) service.estimatedDurationMinutes = estimatedDurationMinutes;
    if (price !== undefined) service.price = price;
    if (maxQueueCapacity) service.maxQueueCapacity = maxQueueCapacity;
    if (prefix) service.prefix = prefix.toUpperCase().trim();
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Protected (Admin / Owner)
const deleteService = async (req, res, next) => {
  try {
    const service = req.service || (await Service.findById(req.params.id));
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully',
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
  updateService,
  deleteService,
};
