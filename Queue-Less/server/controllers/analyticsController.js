const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Branch = require('../models/Branch');
const asyncHandler = require('../middleware/asyncHandler');

// Helper: milliseconds to minutes
const msToMin = (ms) => Math.round(ms / 60000);

/**
 * @desc  Get analytics for a specific queue
 * @route GET /api/analytics/queue/:queueId
 * @access Private (Admin)
 */
const getQueueAnalytics = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { date } = req.query; // e.g. 2024-01-15

  const startOfDay = date ? new Date(date) : new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const tokens = await Token.find({
    queue: queueId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const total = tokens.length;
  const completed = tokens.filter((t) => t.status === 'COMPLETED');
  const skipped = tokens.filter((t) => t.status === 'SKIPPED');
  const waiting = tokens.filter((t) => t.status === 'WAITING');
  const cancelled = tokens.filter((t) => t.status === 'CANCELLED');

  // Average wait time (issuedAt -> calledAt)
  const waitTimes = completed
    .filter((t) => t.issuedAt && t.calledAt)
    .map((t) => t.calledAt - t.issuedAt);

  const avgWaitTime =
    waitTimes.length > 0
      ? msToMin(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

  // Average service time (calledAt -> completedAt)
  const serviceTimes = completed
    .filter((t) => t.calledAt && t.completedAt)
    .map((t) => t.completedAt - t.calledAt);

  const avgServiceTime =
    serviceTimes.length > 0
      ? msToMin(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
      : 0;

  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const skipRate = total > 0 ? Math.round((skipped.length / total) * 100) : 0;

  // Hourly distribution (0-23)
  const hourlyDistribution = Array(24).fill(0);
  tokens.forEach((t) => {
    if (t.issuedAt) {
      const hour = new Date(t.issuedAt).getHours();
      hourlyDistribution[hour]++;
    }
  });

  // Peak hour
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

  res.json({
    date: startOfDay.toISOString().split('T')[0],
    summary: {
      total,
      completed: completed.length,
      skipped: skipped.length,
      waiting: waiting.length,
      cancelled: cancelled.length,
      completionRate,
      skipRate,
      avgWaitTime,
      avgServiceTime,
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
    },
    hourlyDistribution,
  });
});

/**
 * @desc  Get analytics for a specific branch (across all queues)
 * @route GET /api/analytics/branch/:branchId
 * @access Private (Admin)
 */
const getBranchAnalytics = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);

  const queues = await Queue.find({ branch: branchId });
  const queueIds = queues.map((q) => q._id);

  const tokens = await Token.find({
    queue: { $in: queueIds },
    createdAt: { $gte: startDate },
  });

  const total = tokens.length;
  const completed = tokens.filter((t) => t.status === 'COMPLETED');
  const skipped = tokens.filter((t) => t.status === 'SKIPPED');

  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
  const skipRate = total > 0 ? Math.round((skipped.length / total) * 100) : 0;

  // Daily breakdown
  const dailyMap = {};
  tokens.forEach((t) => {
    const day = new Date(t.createdAt).toISOString().split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { total: 0, completed: 0, skipped: 0 };
    dailyMap[day].total++;
    if (t.status === 'COMPLETED') dailyMap[day].completed++;
    if (t.status === 'SKIPPED') dailyMap[day].skipped++;
  });

  const dailyStats = Object.entries(dailyMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, stats]) => ({ date, ...stats }));

  // Wait time averages
  const waitTimes = completed
    .filter((t) => t.issuedAt && t.calledAt)
    .map((t) => t.calledAt - t.issuedAt);

  const avgWaitTime =
    waitTimes.length > 0
      ? msToMin(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

  res.json({
    period: `Last ${days} days`,
    summary: {
      total,
      completed: completed.length,
      skipped: skipped.length,
      completionRate,
      skipRate,
      avgWaitTime,
      activeQueues: queues.length,
    },
    dailyStats,
  });
});

/**
 * @desc  Get leaderboard / top performing branches for a business
 * @route GET /api/analytics/business/:businessId/leaderboard
 * @access Private (Admin)
 */
const getBusinessLeaderboard = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const branches = await Branch.find({ business: businessId });

  const leaderboard = await Promise.all(
    branches.map(async (branch) => {
      const queues = await Queue.find({ branch: branch._id });
      const queueIds = queues.map((q) => q._id);

      const tokens = await Token.find({
        queue: { $in: queueIds },
        createdAt: { $gte: startDate },
      });

      const completed = tokens.filter((t) => t.status === 'COMPLETED');
      const completionRate =
        tokens.length > 0 ? Math.round((completed.length / tokens.length) * 100) : 0;

      const waitTimes = completed
        .filter((t) => t.issuedAt && t.calledAt)
        .map((t) => t.calledAt - t.issuedAt);

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
        score: completionRate - avgWaitTime * 0.5, // composite performance score
      };
    })
  );

  leaderboard.sort((a, b) => b.score - a.score);

  res.json({
    businessId,
    period: `Last ${days} days`,
    leaderboard,
  });
});

module.exports = {
  getQueueAnalytics,
  getBranchAnalytics,
  getBusinessLeaderboard,
};
