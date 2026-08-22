const Queue = require('../models/Queue');
const Token = require('../models/Token');
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
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
      });
    }

    const waitingCount = await Token.countDocuments({
      queueId: queue._id,
      status: 'WAITING',
    });

    res.status(200).json({
      success: true,
      data: {
        ...queue.toObject(),
        waitingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join queue and issue new digital token
// @route   POST /api/queues/:id/join
// @access  Protected (Customer)
const joinQueue = async (req, res, next) => {
  try {
    const queueId = req.params.id;
    const { forPersonName, forPersonPhone } = req.body;

    let queue = await Queue.findById(queueId).populate('serviceId');
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
      });
    }

    if (queue.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: `Cannot join queue. Queue is currently ${queue.status}`,
      });
    }

    const service = queue.serviceId;
    const sequenceNumber = queue.totalTokensIssued + 1;
    const tokenNumber = generateTokenNumber(service ? service.prefix : 'A', sequenceNumber);

    const peopleAhead = await Token.countDocuments({
      queueId: queue._id,
      status: 'WAITING',
    });

    const estWaitMinutes = calculateWaitTime(
      peopleAhead,
      service ? service.estimatedDurationMinutes : 15
    );

    const token = await Token.create({
      queueId: queue._id,
      tokenNumber,
      sequenceNumber,
      userId: req.user.id,
      forPersonName: forPersonName || 'Myself',
      forPersonPhone: forPersonPhone || '',
      status: 'WAITING',
      estimatedWaitTimeMinutes: estWaitMinutes,
    });

    // Increment queue token count
    queue.totalTokensIssued = sequenceNumber;
    await queue.save();

    res.status(201).json({
      success: true,
      data: {
        token,
        peopleAhead,
        estimatedWaitTimeMinutes: estWaitMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Call next customer in queue
// @route   POST /api/queues/:id/next
// @access  Protected (Admin)
const callNext = async (req, res, next) => {
  try {
    const result = await queueStateMachine.callNextCustomer(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Pause queue
// @route   POST /api/queues/:id/pause
// @access  Protected (Admin)
const pauseQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.pauseQueue(req.params.id);
    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Resume queue
// @route   POST /api/queues/:id/resume
// @access  Protected (Admin)
const resumeQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.resumeQueue(req.params.id);
    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Close queue
// @route   POST /api/queues/:id/close
// @access  Protected (Admin)
const closeQueue = async (req, res, next) => {
  try {
    const queue = await queueStateMachine.closeQueue(req.params.id);
    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueStatus,
  joinQueue,
  callNext,
  pauseQueue,
  resumeQueue,
  closeQueue,
};
