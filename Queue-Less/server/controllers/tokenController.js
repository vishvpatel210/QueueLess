const Token = require('../models/Token');
const Queue = require('../models/Queue');
const queueStateMachine = require('../services/queueStateMachine');

// @desc    Get token details and queue position
// @route   GET /api/tokens/:id
// @access  Protected
const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate({
        path: 'queueId',
        populate: [
          {
            path: 'branchId',
            populate: { path: 'businessId' },
          },
          {
            path: 'serviceId',
          },
        ],
      })
      .populate('userId', 'name email phone');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Calculate people ahead if still waiting
    let peopleAhead = 0;
    if (token.status === 'WAITING' && token.queueId) {
      peopleAhead = await Token.countDocuments({
        queueId: token.queueId._id,
        status: 'WAITING',
        sequenceNumber: { $lt: token.sequenceNumber },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...token.toObject(),
        peopleAhead,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's active tokens
// @route   GET /api/tokens/active
// @access  Protected
const getMyActiveTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({
      userId: req.user.id,
      status: { $in: ['WAITING', 'SERVING'] },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'queueId',
        populate: [
          {
            path: 'branchId',
            populate: { path: 'businessId' },
          },
          {
            path: 'serviceId',
          },
        ],
      });

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel user's token
// @route   POST /api/tokens/:id/cancel
// @access  Protected
const cancelToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Verify ownership or admin role
    if (token.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this token',
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(token.status)) {
      return res.status(400).json({
        success: false,
        message: `Token is already ${token.status}`,
      });
    }

    token.status = 'CANCELLED';
    await token.save();

    res.status(200).json({
      success: true,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Skip customer token
// @route   POST /api/tokens/:id/skip
// @access  Protected (Admin)
const skipToken = async (req, res, next) => {
  try {
    const token = await queueStateMachine.skipCustomer(req.params.id);
    res.status(200).json({
      success: true,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Mark token completed
// @route   POST /api/tokens/:id/complete
// @access  Protected (Admin)
const completeToken = async (req, res, next) => {
  try {
    const token = await queueStateMachine.completeCustomer(req.params.id);
    res.status(200).json({
      success: true,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTokenById,
  getMyActiveTokens,
  cancelToken,
  skipToken,
  completeToken,
};
