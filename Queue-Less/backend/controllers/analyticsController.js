const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Branch = require('../models/Branch');
const Business = require('../models/Business');

// Helper: milliseconds to minutes
const msToMin = (ms) => Math.round(ms / 60000);

// @desc    Get today's analytics for a branch
// @route   GET /api/analytics/branch/:branchId
// @access  Protected (SHOP_ADMIN)
const getBranchAnalytics = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { days = 1 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // All queues for this branch
    const queues = await Queue.find({ branchId });
    const queueIds = queues.map((q) => q._id);

    const tokens = await Token.find({
      queueId: { $in: queueIds },
      joinedAt: { $gte: startDate },
    }).populate('serviceId', 'name estimatedDurationMinutes');

    const total = tokens.length;
    const completed = tokens.filter((t) => t.status === 'COMPLETED');
    const waiting = tokens.filter((t) => t.status === 'WAITING');
    const called = tokens.filter((t) => t.status === 'CALLED');
    const inProgress = tokens.filter((t) => t.status === 'IN_PROGRESS');
    const skipped = tokens.filter((t) => t.status === 'SKIPPED');
    const noShow = tokens.filter((t) => t.status === 'NO_SHOW');
    const cancelled = tokens.filter((t) => t.status === 'CANCELLED');

    // Average wait time (joinedAt → calledAt)
    const waitTimes = completed
      .filter((t) => t.joinedAt && t.calledAt)
      .map((t) => t.calledAt - t.joinedAt);
    const avgWaitTime =
      waitTimes.length > 0
        ? msToMin(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

    // Average service time (startedAt → completedAt)
    const serviceTimes = completed
      .filter((t) => t.startedAt && t.completedAt)
      .map((t) => t.completedAt - t.startedAt);
    const avgServiceTime =
      serviceTimes.length > 0
        ? msToMin(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
        : 0;

    // Hourly distribution based on joinedAt
    const hourlyDistribution = Array(24).fill(0);
    tokens.forEach((t) => {
      if (t.joinedAt) {
        const hour = new Date(t.joinedAt).getHours();
        hourlyDistribution[hour]++;
      }
    });

    // Peak hour
    const maxCount = Math.max(...hourlyDistribution);
    const peakHour = maxCount > 0 ? hourlyDistribution.indexOf(maxCount) : -1;

    // Service-wise demand
    const serviceMap = {};
    tokens.forEach((t) => {
      const key = t.serviceId?.name || 'Unknown Service';
      if (!serviceMap[key]) serviceMap[key] = { name: key, count: 0, completed: 0 };
      serviceMap[key].count++;
      if (t.status === 'COMPLETED') serviceMap[key].completed++;
    });
    const serviceBreakdown = Object.values(serviceMap).sort((a, b) => b.count - a.count);

    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No analytics data available yet.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: days === 1 ? 'Today' : `Last ${days} days`,
        summary: {
          total,
          waiting: waiting.length + called.length + inProgress.length,
          completed: completed.length,
          cancelled: cancelled.length,
          skipped: skipped.length,
          noShow: noShow.length,
          avgWaitTime,
          avgServiceTime,
          completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
        },
        peakHour: peakHour >= 0 ? `${peakHour}:00 – ${peakHour + 1}:00` : 'N/A',
        hourlyDistribution,
        serviceBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics for a specific queue
// @route   GET /api/analytics/queue/:queueId
// @access  Protected (SHOP_ADMIN)
const getQueueAnalytics = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tokens = await Token.find({
      queueId,
      joinedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const total = tokens.length;
    const completed = tokens.filter((t) => t.status === 'COMPLETED');
    const waiting = tokens.filter((t) => t.status === 'WAITING');
    const skipped = tokens.filter((t) => t.status === 'SKIPPED');
    const noShow = tokens.filter((t) => t.status === 'NO_SHOW');
    const cancelled = tokens.filter((t) => t.status === 'CANCELLED');

    const waitTimes = completed
      .filter((t) => t.joinedAt && t.calledAt)
      .map((t) => t.calledAt - t.joinedAt);
    const avgWaitTime =
      waitTimes.length > 0
        ? msToMin(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

    const serviceTimes = completed
      .filter((t) => t.startedAt && t.completedAt)
      .map((t) => t.completedAt - t.startedAt);
    const avgServiceTime =
      serviceTimes.length > 0
        ? msToMin(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
        : 0;

    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No analytics data available yet.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total,
        completed: completed.length,
        waiting: waiting.length,
        skipped: skipped.length,
        noShow: noShow.length,
        cancelled: cancelled.length,
        avgWaitTime,
        avgServiceTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business-wide leaderboard
// @route   GET /api/analytics/business/:businessId/leaderboard
// @access  Protected (SHOP_ADMIN)
const getBusinessLeaderboard = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const branches = await Branch.find({ businessId });
    const leaderboard = await Promise.all(
      branches.map(async (branch) => {
        const queues = await Queue.find({ branchId: branch._id });
        const queueIds = queues.map((q) => q._id);

        const tokens = await Token.find({
          queueId: { $in: queueIds },
          joinedAt: { $gte: startDate },
        });

        const completed = tokens.filter((t) => t.status === 'COMPLETED');
        const completionRate =
          tokens.length > 0 ? Math.round((completed.length / tokens.length) * 100) : 0;

        const waitTimes = completed
          .filter((t) => t.joinedAt && t.calledAt)
          .map((t) => t.calledAt - t.joinedAt);
        const avgWaitTime =
          waitTimes.length > 0
            ? msToMin(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
            : 0;

        return {
          branchId: branch._id,
          branchName: branch.name,
          totalTokens: tokens.length,
          completedTokens: completed.length,
          completionRate,
          avgWaitTime,
        };
      })
    );

    leaderboard.sort((a, b) => b.completedTokens - a.completedTokens);

    res.status(200).json({
      success: true,
      data: { period: `Last ${days} days`, leaderboard },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueAnalytics,
  getBranchAnalytics,
  getBusinessLeaderboard,
};
