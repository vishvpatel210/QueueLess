const Queue = require('../models/Queue');
const Token = require('../models/Token');

const queueStateMachine = {
  /**
   * Admin calls the next waiting customer.
   * 1. Validates queue is OPEN.
   * 2. Marks any active CALLED/IN_PROGRESS token as COMPLETED.
   * 3. Finds next WAITING token by sequenceNumber.
   * 4. Updates next token to CALLED.
   * 5. Updates queue currentTokenNumber & currentTokenId.
   */
  async callNextCustomer(queueId) {
    const queue = await Queue.findById(queueId);
    if (!queue) throw new Error('Queue not found');
    if (queue.status !== 'OPEN') throw new Error(`Queue is currently ${queue.status}`);

    // Complete any currently active token
    if (queue.currentTokenId) {
      await Token.findByIdAndUpdate(queue.currentTokenId, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });
    }

    // Find next WAITING token
    const nextToken = await Token.findOne({
      queueId,
      status: 'WAITING',
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      queue.currentTokenNumber = null;
      queue.currentTokenId = null;
      await queue.save();
      return { queue, nextToken: null, message: 'No waiting customers in queue.' };
    }

    nextToken.status = 'CALLED';
    nextToken.calledAt = new Date();
    await nextToken.save();

    queue.currentTokenNumber = nextToken.tokenNumber;
    queue.currentTokenId = nextToken._id;
    await queue.save();

    return { queue, nextToken };
  },

  async skipCustomer(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'SKIPPED';
    await token.save();
    return token;
  },

  async completeCustomer(tokenId) {
    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'COMPLETED';
    token.completedAt = new Date();
    await token.save();
    return token;
  },

  async pauseQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'PAUSED' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    return queue;
  },

  async resumeQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'OPEN' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    return queue;
  },

  async closeQueue(queueId) {
    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { status: 'CLOSED' },
      { new: true }
    );
    if (!queue) throw new Error('Queue not found');
    return queue;
  },
};

module.exports = queueStateMachine;
