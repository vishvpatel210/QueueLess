const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Service = require('../models/Service');
const Branch = require('../models/Branch');
const Business = require('../models/Business');
const generateTokenNumber = require('../utils/generateTokenNumber');
const calculateWaitTime = require('../utils/calculateWaitTime');
const queueStateMachine = require('../services/queueStateMachine');

// @desc    Get queue details and status
// @route   GET /api/queues/:id
// @access  Public
const getQueueStatus = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('branchId')
      .populate('serviceId');

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const waitingCount = await Token.countDocuments({ queueId: queue._id, status: 'WAITING' });
    const calledCount = await Token.countDocuments({ queueId: queue._id, status: 'CALLED' });
    const inProgressCount = await Token.countDocuments({ queueId: queue._id, status: 'IN_PROGRESS' });

    res.status(200).json({
      success: true,
      data: {
        ...queue.toObject(),
        waitingCount,
        calledCount,
        inProgressCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tokens in a queue — admin view
// @route   GET /api/queues/:id/tokens
// @access  Protected (SHOP_ADMIN)
const getQueueTokens = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('branchId')
      .populate('serviceId');

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found' });
    }

    const tokens = await Token.find({ queueId: queue._id })
      .sort({ sequenceNumber: 1 })
      .populate('userId', 'name email phone');

    const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
    const calledToken = tokens.find((t) => t.status === 'CALLED') || null;
    const inProgressToken = tokens.find((t) => t.status === 'IN_PROGRESS') || null;
    const servingToken = inProgressToken || calledToken;
    const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');
    const skippedTokens = tokens.filter((t) => t.status === 'SKIPPED');
    const noShowTokens = tokens.filter((t) => t.status === 'NO_SHOW');
    const cancelledTokens = tokens.filter((t) => t.status === 'CANCELLED');

    res.status(200).json({
      success: true,
      data: {
        queue,
        waitingTokens,
        servingToken,
        calledToken,
        inProgressToken,
        completedCount: completedTokens.length,
        skippedCount: skippedTokens.length,
        noShowCount: noShowTokens.length,
        cancelledCount: cancelledTokens.length,
        allTokens: tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join queue — ATOMIC token generation using $inc
// @route   POST /api/queues/:id/join
// @access  Protected (CUSTOMER)
const joinQueue = async (req, res, next) => {
  try {
    const queueId = req.params.id;
    const { forPersonName, forPersonPhone } = req.body;
    const userId = req.user._id;

    // Verify customer role — never trust frontend-provided role
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can join queues.',
      });
    }

    // Verify customer does not already have an active token in this queue
    const existingToken = await Token.findOne({
      userId,
      queueId,
      status: { $in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
    });

    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active token in this queue.',
        data: { tokenId: existingToken._id },
      });
    }

    // ATOMIC increment using findOneAndUpdate to prevent race conditions
    const updatedQueue = await Queue.findOneAndUpdate(
      { _id: queueId, status: 'OPEN' },
      { $inc: { totalTokensIssued: 1 } },
      { new: true }
    ).populate('serviceId');

    if (!updatedQueue) {
      // Queue not found or not OPEN
      const queueCheck = await Queue.findById(queueId);
      if (!queueCheck) {
        return res.status(404).json({ success: false, message: 'Queue not found.' });
      }
      return res.status(400).json({
        success: false,
        message: `Cannot join queue. Queue is currently ${queueCheck.status}.`,
      });
    }

    const service = updatedQueue.serviceId;
    if (!service || !service.isActive) {
      // Roll back the increment
      await Queue.findByIdAndUpdate(queueId, { $inc: { totalTokensIssued: -1 } });
      return res.status(400).json({ success: false, message: 'Service is not active.' });
    }

    const sequenceNumber = updatedQueue.totalTokensIssued;
    const prefix = service.prefix || 'A';
    const tokenNumber = generateTokenNumber(prefix, sequenceNumber);
    const displayToken = tokenNumber; // e.g. GEN-024

    const peopleAhead = await Token.countDocuments({
      queueId: updatedQueue._id,
      status: 'WAITING',
      sequenceNumber: { $lt: sequenceNumber },
    });

    const estWaitMinutes = calculateWaitTime(
      peopleAhead,
      service.estimatedDurationMinutes || 15
    );

    const token = await Token.create({
      queueId: updatedQueue._id,
      branchId: updatedQueue.branchId,
      serviceId: service._id,
      tokenNumber,
      displayToken,
      sequenceNumber,
      userId,
      forPersonName: forPersonName || 'Myself',
      forPersonPhone: forPersonPhone || '',
      status: 'WAITING',
      estimatedWaitTimeMinutes: estWaitMinutes,
      joinedAt: new Date(),
    });

    // Populate for response
    const populated = await Token.findById(token._id)
      .populate({ path: 'queueId', populate: [{ path: 'branchId', populate: { path: 'businessId' } }, { path: 'serviceId' }] });

    res.status(201).json({
      success: true,
      data: {
        token: populated,
        peopleAhead,
        estimatedWaitTimeMinutes: estWaitMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Call next customer
// @route   POST /api/queues/:id/next
// @access  Protected (SHOP_ADMIN)
const callNext = async (req, res, next) => {
  try {
    const result = await queueStateMachine.callNextCustomer(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Start service on called token
// @route   POST /api/queues/:queueId/tokens/:tokenId/start
// @access  Protected (SHOP_ADMIN)
const startService = async (req, res, next) => {
  try {
    const token = await queueStateMachine.startService(req.params.tokenId);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Mark no-show on called token
// @route   POST /api/queues/:queueId/tokens/:tokenId/no-show
// @access  Protected (SHOP_ADMIN)
const noShowCustomer = async (req, res, next) => {
  try {
    const token = await queueStateMachine.noShowCustomer(req.params.tokenId);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Pause queue
// @route   POST /api/queues/:id/pause
// @access  Protected (SHOP_ADMIN)
const pauseQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.pauseQueue(req.params.id);
    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Resume queue
// @route   POST /api/queues/:id/resume
// @access  Protected (SHOP_ADMIN)
const resumeQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.resumeQueue(req.params.id);
    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Close queue
// @route   POST /api/queues/:id/close
// @access  Protected (SHOP_ADMIN)
const closeQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.closeQueue(req.params.id);
    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueStatus,
  getQueueTokens,
  joinQueue,
  callNext,
  startService,
  noShowCustomer,
  pauseQueue,
  resumeQueue,
  closeQueue,
};
