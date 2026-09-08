require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/constants');
const Business = require('./models/Business');
const Branch = require('./models/Branch');
const Service = require('./models/Service');
const Queue = require('./models/Queue');
const Token = require('./models/Token');
const User = require('./models/User');

async function purgeFakeSeedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Wipe all fake seeded businesses, branches, services, queues, tokens
    await Promise.all([
      Business.deleteMany({}),
      Branch.deleteMany({}),
      Service.deleteMany({}),
      Queue.deleteMany({}),
      Token.deleteMany({}),
      User.deleteMany({
        email: {
          $in: [
            'hospital@queueless.io',
            'clinic@queueless.io',
            'salon@queueless.io',
            'bank@queueless.io',
            'govt@queueless.io',
            'dental@queueless.io',
            'eye@queueless.io',
            'pharmacy@queueless.io',
          ],
        },
      }),
    ]);

    console.log('✅ Successfully purged all fake/dummy businesses from MongoDB!');
    console.log('Single source of truth: Only genuine businesses registered via /register-admin will appear.');
    process.exit(0);
  } catch (e) {
    console.error('Error purging data:', e);
    process.exit(1);
  }
}

purgeFakeSeedData();
