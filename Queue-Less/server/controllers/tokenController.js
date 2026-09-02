const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Review = require('../models/Review');
const queueStateMachine = require('../services/queueStateMachine');

// @desc    Get token details and live queue position
// @route   GET /api/tokens/:id
// @access  Protected
const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate({
        path: 'queueId',
        populate: [
          { path: 'branchId', populate: { path: 'businessId' } },
          { path: 'serviceId' },
        ],
      })
      .populate('userId', 'name email phone');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Only the token owner or a SHOP_ADMIN may view token details
    if (
      token.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'SHOP_ADMIN'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this token.' });
    }

    // Calculate live position
    let peopleAhead = 0;
    let position = 0;
    if (['WAITING', 'CALLED'].includes(token.status) && token.queueId) {
      peopleAhead = await Token.countDocuments({
        queueId: token.queueId._id,
        status: 'WAITING',
        sequenceNumber: { $lt: token.sequenceNumber },
      });
      position = peopleAhead + 1;
    }

    // Check if a review already exists for this token
    const hasReview = await Review.exists({ tokenId: token._id });

    res.status(200).json({
      success: true,
      data: {
        ...token.toObject(),
        peopleAhead,
        position,
        hasReview: !!hasReview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's active tokens (WAITING, CALLED, IN_PROGRESS)
// @route   GET /api/tokens/active
// @access  Protected (CUSTOMER)
const getMyActiveTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({
      userId: req.user._id,
      status: { $in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'queueId',
        populate: [
          { path: 'branchId', populate: { path: 'businessId' } },
          { path: 'serviceId' },
        ],
      });

    // Attach live position to each token
    const enriched = await Promise.all(
      tokens.map(async (t) => {
        let peopleAhead = 0;
        if (t.status === 'WAITING' && t.queueId) {
          peopleAhead = await Token.countDocuments({
            queueId: t.queueId._id,
            status: 'WAITING',
            sequenceNumber: { $lt: t.sequenceNumber },
          });
        }
        return { ...t.toObject(), peopleAhead };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's token history (completed, cancelled, skipped, no-show)
// @route   GET /api/tokens/history
// @access  Protected (CUSTOMER)
const getMyTokenHistory = async (req, res, next) => {
  try {
    const tokens = await Token.find({
      userId: req.user._id,
      status: { $in: ['COMPLETED', 'CANCELLED', 'SKIPPED', 'NO_SHOW'] },
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate({
        path: 'queueId',
        populate: [
          { path: 'branchId', populate: { path: 'businessId' } },
          { path: 'serviceId' },
        ],
      });

    // Attach hasReview flag
    const enriched = await Promise.all(
      tokens.map(async (t) => {
        const hasReview = await Review.exists({ tokenId: t._id });
        return { ...t.toObject(), hasReview: !!hasReview };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer cancels their own token
// @route   POST /api/tokens/:id/cancel
// @access  Protected (CUSTOMER)
const cancelToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Ownership check — only the token owner can cancel
    if (token.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this token.' });
    }

    if (!['WAITING', 'CALLED'].includes(token.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel. Token is already ${token.status}.`,
      });
    }

    token.status = 'CANCELLED';
    token.cancelledAt = new Date();
    await token.save();

    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Skip customer token
// @route   POST /api/tokens/:id/skip
// @access  Protected (SHOP_ADMIN)
const skipToken = async (req, res, next) => {
  try {
    const token = await queueStateMachine.skipCustomer(req.params.id);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Mark token completed — admin MUST do this manually
// @route   POST /api/tokens/:id/complete
// @access  Protected (SHOP_ADMIN)
const completeToken = async (req, res, next) => {
  try {
    const token = await queueStateMachine.completeCustomer(req.params.id);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Start service — CALLED → IN_PROGRESS
// @route   POST /api/tokens/:id/start
// @access  Protected (SHOP_ADMIN)
const startTokenService = async (req, res, next) => {
  try {
    const token = await queueStateMachine.startService(req.params.id);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: No-show — CALLED → NO_SHOW
// @route   POST /api/tokens/:id/no-show
// @access  Protected (SHOP_ADMIN)
const noShowToken = async (req, res, next) => {
  try {
    const token = await queueStateMachine.noShowCustomer(req.params.id);
    res.status(200).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer submits review after COMPLETED visit
// @route   POST /api/tokens/:id/review
// @access  Protected (CUSTOMER)
const submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    // Only the token's customer may review
    if (token.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this token.' });
    }

    // Can only review a COMPLETED token
    if (token.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'You can only submit a review after your visit is marked COMPLETED.',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Populate to get businessId
    const populatedToken = await Token.findById(token._id).populate({
      path: 'queueId',
      populate: [{ path: 'branchId', populate: { path: 'businessId' } }, { path: 'serviceId' }],
    });

    const branchId = populatedToken.branchId || populatedToken.queueId?.branchId?._id;
    const businessId = populatedToken.queueId?.branchId?.businessId?._id;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Cannot resolve business for this token.' });
    }

    // unique: true on tokenId prevents duplicates
    const review = await Review.create({
      customerId: req.user._id,
      businessId,
      branchId: branchId,
      serviceId: populatedToken.serviceId || populatedToken.queueId?.serviceId?._id,
      tokenId: token._id,
      rating: parseInt(rating),
      comment: (comment || '').trim(),
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this visit.',
      });
    }
    next(error);
  }
};

module.exports = {
  getTokenById,
  getMyActiveTokens,
  getMyTokenHistory,
  cancelToken,
  skipToken,
  completeToken,
  startTokenService,
  noShowToken,
  submitReview,
};
