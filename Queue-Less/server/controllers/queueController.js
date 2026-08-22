const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Service = require('../models/Service');
const generateTokenNumber = require('../utils/generateTokenNumber');
const calculateWaitTime = require('../utils/calculateWaitTime');

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

module.exports = {
  getQueueStatus,
  joinQueue,
};
