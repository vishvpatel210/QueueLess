const Business = require('../models/Business');
const Branch = require('../models/Branch');
const Service = require('../models/Service');
const Queue = require('../models/Queue');

// Verify that the authenticated user owns the specified Business
const verifyBusinessOwnership = async (req, res, next) => {
  try {
    const businessId = req.params.id || req.params.businessId || req.body.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID is required.' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own this business.',
      });
    }

    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
};

// Verify that the authenticated user owns the business associated with this Branch
const verifyBranchOwnership = async (req, res, next) => {
  try {
    const branchId = req.params.id || req.params.branchId || req.body.branchId;
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch ID is required.' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    const business = await Business.findById(branch.businessId);
    if (!business || business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own the business for this branch.',
      });
    }

    req.branch = branch;
    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
};

// Verify that the authenticated user owns the business associated with this Service
const verifyServiceOwnership = async (req, res, next) => {
  try {
    const serviceId = req.params.id || req.params.serviceId || req.body.serviceId;
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required.' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const branch = await Branch.findById(service.branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found for this service.' });
    }

    const business = await Business.findById(branch.businessId);
    if (!business || business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own the business for this service.',
      });
    }

    req.service = service;
    req.branch = branch;
    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
};

// Verify that the authenticated user owns the business associated with this Queue
const verifyQueueOwnership = async (req, res, next) => {
  try {
    const queueId = req.params.id || req.params.queueId || req.body.queueId;
    if (!queueId) {
      return res.status(400).json({ success: false, message: 'Queue ID is required.' });
    }

    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    const branch = await Branch.findById(queue.branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found for this queue.' });
    }

    const business = await Business.findById(branch.businessId);
    if (!business || business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You do not own the business for this queue.',
      });
    }

    req.queue = queue;
    req.branch = branch;
    req.business = business;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyBusinessOwnership,
  verifyBranchOwnership,
  verifyServiceOwnership,
  verifyQueueOwnership,
};
