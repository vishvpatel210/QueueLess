const Token = require('../models/Token');
const Queue = require('../models/Queue');

// @desc    Get token details and queue position
// @route   GET /api/tokens/:id
// @access  Protected
const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id).populate({
      path: 'queueId',
      populate: ['branchId', 'serviceId'],
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Calculate people ahead if still waiting
    let peopleAhead = 0;
    if (token.status === 'WAITING') {
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

module.exports = {
  getTokenById,
  cancelToken,
};
