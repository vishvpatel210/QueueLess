const dns = require('dns');
// Set public Google / Cloudflare DNS to resolve MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fallback if system restricts custom DNS
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGODB_URI } = require('./config/constants');
const User = require('./models/User');
const Business = require('./models/Business');
const Branch = require('./models/Branch');
const Service = require('./models/Service');
const Queue = require('./models/Queue');
const Token = require('./models/Token');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[Seed] Connected to MongoDB Atlas successfully.');

    // Clear existing collections if desired
    await User.deleteMany({});
    await Business.deleteMany({});
    await Branch.deleteMany({});
    await Service.deleteMany({});
    await Queue.deleteMany({});
    await Token.deleteMany({});

    console.log('[Seed] Cleared existing data.');

    // 1. Create Admin & Customer Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin123!', salt);
    const customerPassword = await bcrypt.hash('Customer123!', salt);

    const adminUser = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'admin@queueless.io',
      passwordHash: adminPassword,
      phone: '+91 98765 43210',
      role: 'admin',
    });

    const customerUser = await User.create({
      name: 'Priya Patel',
      email: 'customer@queueless.io',
      passwordHash: customerPassword,
      phone: '+91 98123 45678',
      role: 'customer',
    });

    console.log('[Seed] Created default users.');

    // 2. Create Real Sample Businesses
    const business1 = await Business.create({
      name: 'City Care Super Specialty Hospital',
      description: '24/7 OPD, emergency consultation, lab diagnostics & cardiology care.',
      category: 'Healthcare',
      ownerId: adminUser._id,
      rating: 4.9,
      reviewCount: 342,
    });

    const business2 = await Business.create({
      name: 'Style Studio Salon & Spa',
      description: 'Premium hair styling, facials, skin care, and luxury spa treatments.',
      category: 'Salon & Spa',
      ownerId: adminUser._id,
      rating: 4.8,
      reviewCount: 189,
    });

    const business3 = await Business.create({
      name: 'HDFC Express Banking Center',
      description: 'Account opening, loan consultations, forex, and express teller counters.',
      category: 'Bank & Finance',
      ownerId: adminUser._id,
      rating: 4.7,
      reviewCount: 512,
    });

    console.log('[Seed] Created sample businesses.');

    // 3. Create Branches with 2dsphere GPS Coordinates
    const todayStr = new Date().toISOString().split('T')[0];

    const branch1 = await Branch.create({
      businessId: business1._id,
      name: 'Central City Hospital OPD',
      address: '72 Medical Hub Road, Near Station Square',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760],
      },
      operatingHours: { open: '08:00', close: '20:00' },
      phone: '+91 22 2456 7890',
      isActive: true,
    });

    const branch2 = await Branch.create({
      businessId: business2._id,
      name: 'Downtown Style Studio',
      address: 'Shop 14, Commercial Boulevard Plaza',
      location: {
        type: 'Point',
        coordinates: [72.8800, 19.0780],
      },
      operatingHours: { open: '10:00', close: '21:00' },
      phone: '+91 22 4567 8901',
      isActive: true,
    });

    console.log('[Seed] Created branches with geospatial coordinates.');

    // 4. Create Services
    const service1 = await Service.create({
      branchId: branch1._id,
      name: 'General OPD Consultation',
      description: 'General doctor consultation and medical evaluation.',
      estimatedDurationMinutes: 15,
      price: 500,
      prefix: 'A',
      isActive: true,
    });

    const service2 = await Service.create({
      branchId: branch1._id,
      name: 'Blood Test & Pathology Lab',
      description: 'Full body checkup, CBC, lipid profile & fast diagnostic reports.',
      estimatedDurationMinutes: 10,
      price: 800,
      prefix: 'B',
      isActive: true,
    });

    const service3 = await Service.create({
      branchId: branch2._id,
      name: 'Hair Styling & Cut',
      description: 'Professional haircut, wash, and blow dry styling.',
      estimatedDurationMinutes: 30,
      price: 650,
      prefix: 'S',
      isActive: true,
    });

    console.log('[Seed] Created services.');

    // 5. Create Live Queues
    const queue1 = await Queue.create({
      branchId: branch1._id,
      serviceId: service1._id,
      date: todayStr,
      status: 'OPEN',
      totalTokensIssued: 4,
      currentTokenNumber: 'A-102',
    });

    console.log('[Seed] Created live queue for today.');

    // 6. Create Tokens
    const t1 = await Token.create({
      queueId: queue1._id,
      tokenNumber: 'A-101',
      sequenceNumber: 1,
      userId: customerUser._id,
      forPersonName: 'Myself',
      status: 'COMPLETED',
      estimatedWaitTimeMinutes: 0,
      calledAt: new Date(Date.now() - 30 * 60000),
      completedAt: new Date(Date.now() - 15 * 60000),
    });

    const t2 = await Token.create({
      queueId: queue1._id,
      tokenNumber: 'A-102',
      sequenceNumber: 2,
      userId: customerUser._id,
      forPersonName: 'Myself',
      status: 'CALLED',
      estimatedWaitTimeMinutes: 0,
      calledAt: new Date(Date.now() - 2 * 60000),
    });

    const t3 = await Token.create({
      queueId: queue1._id,
      tokenNumber: 'A-103',
      sequenceNumber: 3,
      userId: customerUser._id,
      forPersonName: 'Karan Patel',
      forPersonPhone: '+91 99887 76655',
      status: 'WAITING',
      estimatedWaitTimeMinutes: 15,
    });

    const t4 = await Token.create({
      queueId: queue1._id,
      tokenNumber: 'A-104',
      sequenceNumber: 4,
      userId: customerUser._id,
      forPersonName: 'Myself',
      status: 'WAITING',
      estimatedWaitTimeMinutes: 30,
    });

    queue1.currentTokenId = t2._id;
    await queue1.save();

    console.log('[Seed] Created live tokens.');
    console.log('\n==========================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Admin Email: admin@queueless.io | Password: Admin123!');
    console.log('Customer Email: customer@queueless.io | Password: Customer123!');
    console.log('==========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedData();
