const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Notification = require('../models/Notification');
const { emitQueueUpdate, emitTokenCalled, emitTokenUpdated } = require('./socketService');

const queueStateMachine = {
  /**
   * Admin calls the next waiting customer.
   * Finds next WAITING token by sequenceNumber.
   * Marks it CALLED, updates queue state, emits Socket.IO events.
   * Does NOT auto-complete any current token — admin must do that manually.
   */
  async callNextCustomer(queueId) {
    const queue = await Queue.findById(queueId);
    if (!queue) throw new Error('Queue not found');
    if (queue.status !== 'OPEN') throw new Error(`Queue is currently ${queue.status}. Cannot call next.`);

    // Find next WAITING token
    const nextToken = await Token.findOne({
      queueId,
      status: 'WAITING',
    })
      .sort({ sequenceNumber: 1 })
      .populate('userId', 'name');

    if (!nextToken) {
      return { queue, nextToken: null, message: 'No waiting customers in queue.' };
    }

    nextToken.status = 'CALLED';
    nextToken.calledAt = new Date();
    await nextToken.save();

    queue.currentTokenNumber = nextToken.tokenNumber;
    queue.currentTokenId = nextToken._id;
    await queue.save();

    // Broadcast queue-wide update
    emitQueueUpdate(queueId, {
      queueId,
      currentTokenNumber: nextToken.tokenNumber,
      currentTokenId: nextToken._id.toString(),
      status: queue.status,
      action: 'CALLED',
    });

    // Notify the specific customer
    emitTokenCalled(nextToken.userId._id.toString(), {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      displayToken: nextToken.displayToken || nextToken.tokenNumber,
      status: 'CALLED',
    });

    // Save notification record
    await Notification.create({
      userId: nextToken.userId._id,
      tokenId: nextToken._id,
      type: 'TOKEN_CALLED',
      title: '🔔 Your Turn!',
      message: `Token ${nextToken.displayToken || nextToken.tokenNumber} — please proceed to the counter now.`,
    });

    return { queue, nextToken };
  },

  /**
   * Admin starts service: CALLED → IN_PROGRESS
   */
  async startService(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== 'CALLED') {
      throw new Error(`Cannot start service. Token is ${token.status}, expected CALLED.`);
    }

    token.status = 'IN_PROGRESS';
    token.startedAt = new Date();
    await token.save();

    emitQueueUpdate(token.queueId.toString(), {
      queueId: token.queueId.toString(),
      tokenId: tokenId,
      action: 'IN_PROGRESS',
    });

    emitTokenUpdated(token.userId.toString(), {
      tokenId: token._id,
      status: 'IN_PROGRESS',
    });

    return token;
  },

  /**
   * Admin manually marks a customer as completed: IN_PROGRESS/CALLED → COMPLETED
   * The Shop Admin MUST tap Mark Completed. Do NOT auto-complete based on time.
   */
  async completeCustomer(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    if (!['IN_PROGRESS', 'CALLED'].includes(token.status)) {
      throw new Error(`Cannot complete. Token is currently ${token.status}.`);
    }

    token.status = 'COMPLETED';
    token.completedAt = new Date();
    await token.save();

    // Clear queue's currentTokenId if this was the serving token
    await Queue.findOneAndUpdate(
      { currentTokenId: token._id },
      { $set: { currentTokenId: null, currentTokenNumber: null } }
    );

    emitQueueUpdate(token.queueId.toString(), {
      queueId: token.queueId.toString(),
      tokenId: tokenId,
      action: 'COMPLETED',
    });

    emitTokenUpdated(token.userId.toString(), {
      tokenId: token._id,
      status: 'COMPLETED',
    });

    await Notification.create({
      userId: token.userId,
      tokenId: token._id,
      type: 'TOKEN_COMPLETED',
      title: '✓ Visit Completed',
      message: `Your visit is complete. Token ${token.displayToken || token.tokenNumber} — thank you!`,
    });

    return token;
  },

  /**
   * Admin skips a customer: WAITING/CALLED → SKIPPED
   * Token is kept in DB for history and analytics.
   */
  async skipCustomer(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    if (!['WAITING', 'CALLED'].includes(token.status)) {
      throw new Error(`Cannot skip. Token is ${token.status}.`);
    }

    token.status = 'SKIPPED';
    token.skippedAt = new Date();
    await token.save();

    emitQueueUpdate(token.queueId.toString(), {
      queueId: token.queueId.toString(),
      tokenId: tokenId,
      action: 'SKIPPED',
    });

    emitTokenUpdated(token.userId.toString(), {
      tokenId: token._id,
      status: 'SKIPPED',
    });

    return token;
  },

  /**
   * Admin marks a called customer as no-show: CALLED → NO_SHOW
   * Token kept for history and analytics.
   */
  async noShowCustomer(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    if (token.status !== 'CALLED') {
      throw new Error(`Cannot mark no-show. Token is ${token.status}, expected CALLED.`);
    }

    token.status = 'NO_SHOW';
    token.noShowAt = new Date();
    await token.save();

    // Clear from queue current
    await Queue.findOneAndUpdate(
      { currentTokenId: token._id },
      { $set: { currentTokenId: null, currentTokenNumber: null } }
    );

    emitQueueUpdate(token.queueId.toString(), {
      queueId: token.queueId.toString(),
      tokenId: tokenId,
      action: 'NO_SHOW',
    });

    return token;
  },

  async pauseQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'PAUSED' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    emitQueueUpdate(queueId, { queueId, status: 'PAUSED', action: 'PAUSED' });
    return queue;
  },

  async resumeQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'OPEN' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    emitQueueUpdate(queueId, { queueId, status: 'OPEN', action: 'RESUMED' });
    return queue;
  },

  async closeQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'CLOSED' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    emitQueueUpdate(queueId, { queueId, status: 'CLOSED', action: 'CLOSED' });
    return queue;
  },
};

module.exports = queueStateMachine;
