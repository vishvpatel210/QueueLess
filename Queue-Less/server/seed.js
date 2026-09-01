require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const { MONGODB_URI } = require('./config/constants');
const User     = require('./models/User');
const Business = require('./models/Business');
const Branch   = require('./models/Branch');
const Service  = require('./models/Service');
const Queue    = require('./models/Queue');
const Token    = require('./models/Token');

// ─── helpers ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const minsAgo = (m) => new Date(Date.now() - m * 60_000);

// ─── seed ────────────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅  MongoDB connected');

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    Branch.deleteMany({}),
    Service.deleteMany({}),
    Queue.deleteMany({}),
    Token.deleteMany({}),
  ]);
  console.log('🗑️   Cleared existing collections');

  // ── 1. Admin users (each owns one business) ───────────────────────────────
  const hash = async (pw) => bcrypt.hash(pw, 10);

  const [
    adminHosp,  adminClinic, adminSalon,
    adminBank,  adminGovt,   adminDental,
    adminEye,   adminPharm,
  ] = await User.insertMany([
    { name: 'Dr. Priya Mehta',       email: 'hospital@queueless.io',   passwordHash: await hash('Admin123!'), phone: '+91 98765 00001', role: 'SHOP_ADMIN' },
    { name: 'Dr. Rohan Desai',       email: 'clinic@queueless.io',     passwordHash: await hash('Admin123!'), phone: '+91 98765 00002', role: 'SHOP_ADMIN' },
    { name: 'Sneha Kapoor',          email: 'salon@queueless.io',      passwordHash: await hash('Admin123!'), phone: '+91 98765 00003', role: 'SHOP_ADMIN' },
    { name: 'Vikram Shah',           email: 'bank@queueless.io',       passwordHash: await hash('Admin123!'), phone: '+91 98765 00004', role: 'SHOP_ADMIN' },
    { name: 'Ravi Kumar',            email: 'govt@queueless.io',       passwordHash: await hash('Admin123!'), phone: '+91 98765 00005', role: 'SHOP_ADMIN' },
    { name: 'Dr. Anjali Trivedi',    email: 'dental@queueless.io',     passwordHash: await hash('Admin123!'), phone: '+91 98765 00006', role: 'SHOP_ADMIN' },
    { name: 'Dr. Sameer Patel',      email: 'eye@queueless.io',        passwordHash: await hash('Admin123!'), phone: '+91 98765 00007', role: 'SHOP_ADMIN' },
    { name: 'Pooja Agarwal',         email: 'pharmacy@queueless.io',   passwordHash: await hash('Admin123!'), phone: '+91 98765 00008', role: 'SHOP_ADMIN' },
  ]);

  // Demo customer
  const customer = await User.create({
    name: 'Vishv Patel',
    email: 'customer@queueless.io',
    passwordHash: await hash('Customer123!'),
    phone: '+91 98765 99999',
    role: 'CUSTOMER',
  });

  console.log('👤  Created users');

  // ── 2. Businesses ──────────────────────────────────────────────────────────
  const [
    bizHosp, bizClinic, bizSalon,
    bizBank, bizGovt,  bizDental,
    bizEye,  bizPharm,
  ] = await Business.insertMany([
    {
      name: 'Apollo Multi-Specialty Hospital',
      description: '24/7 emergency, ICU, OPD consultations, advanced diagnostics & surgery.',
      category: 'Healthcare', ownerId: adminHosp._id, rating: 4.8, reviewCount: 1243,
    },
    {
      name: 'MedPlus Family Clinic',
      description: 'Affordable general physician, paediatrics, gynaecology & preventive health checkups.',
      category: 'Healthcare', ownerId: adminClinic._id, rating: 4.6, reviewCount: 876,
    },
    {
      name: 'Lakmé Salon & Studio',
      description: 'Premium hair styling, facials, bridal makeup, waxing & luxury spa treatments.',
      category: 'Salon & Spa', ownerId: adminSalon._id, rating: 4.7, reviewCount: 654,
    },
    {
      name: 'SBI Express Banking Branch',
      description: 'Account opening, DD, loan consultation, forex, locker & express teller counters.',
      category: 'Bank & Finance', ownerId: adminBank._id, rating: 4.3, reviewCount: 1109,
    },
    {
      name: 'Aadhar & PAN Seva Kendra',
      description: 'Government-approved centre for Aadhar updates, PAN card, passport & ration card services.',
      category: 'Government Services', ownerId: adminGovt._id, rating: 4.2, reviewCount: 789,
    },
    {
      name: 'SmileCare Dental Clinic',
      description: 'Root canal, braces, implants, teeth whitening & regular dental check-ups.',
      category: 'Healthcare', ownerId: adminDental._id, rating: 4.9, reviewCount: 423,
    },
    {
      name: 'ClearVision Eye Hospital',
      description: 'Cataract surgery, LASIK, retina specialist, diabetic eye screening & spectacle fitting.',
      category: 'Healthcare', ownerId: adminEye._id, rating: 4.8, reviewCount: 531,
    },
    {
      name: 'HealthPlus Pharmacy & Diagnostic',
      description: 'Medicines, lab tests, home sample collection, health packages & doctor consultations.',
      category: 'Healthcare', ownerId: adminPharm._id, rating: 4.5, reviewCount: 342,
    },
  ]);

  console.log('🏢  Created businesses');

  // ── 3. Branches with REAL GPS coordinates (Ahmedabad, Surat, Mumbai) ───────
  // Format: coordinates: [longitude, latitude]
  const [
    brApollo1, brApollo2,
    brClinic1, brClinic2,
    brSalon1,  brSalon2,
    brBank1,   brBank2,
    brGovt1,
    brDental1,
    brEye1,
    brPharm1,
  ] = await Branch.insertMany([
    // Apollo Hospital — Ahmedabad & Surat
    {
      businessId: bizHosp._id,
      name: 'Apollo Hospital Ahmedabad',
      address: 'Plot No. 1A, Bhat Village, GIDC Electronic Estate, Gandhinagar Highway, Ahmedabad, Gujarat 382428',
      location: { type: 'Point', coordinates: [72.5714, 23.0760] },
      operatingHours: { open: '00:00', close: '23:59' },
      phone: '+91 79 6670 1800',
      isActive: true,
    },
    {
      businessId: bizHosp._id,
      name: 'Apollo Hospital Surat',
      address: 'Near Cosmo Mall, Ghod Dod Road, Surat, Gujarat 395007',
      location: { type: 'Point', coordinates: [72.8347, 21.1702] },
      operatingHours: { open: '00:00', close: '23:59' },
      phone: '+91 261 671 8000',
      isActive: true,
    },
    // MedPlus Clinic — Ahmedabad & Vadodara
    {
      businessId: bizClinic._id,
      name: 'MedPlus Clinic Bopal, Ahmedabad',
      address: 'Shop 4, Sun Plaza, Bopal Main Road, Ahmedabad, Gujarat 380058',
      location: { type: 'Point', coordinates: [72.4695, 23.0364] },
      operatingHours: { open: '08:00', close: '21:00' },
      phone: '+91 79 4890 1234',
      isActive: true,
    },
    {
      businessId: bizClinic._id,
      name: 'MedPlus Clinic Vadodara',
      address: 'Near Sayaji Gardens, Akota, Vadodara, Gujarat 390020',
      location: { type: 'Point', coordinates: [73.1812, 22.3218] },
      operatingHours: { open: '08:00', close: '21:00' },
      phone: '+91 265 234 5678',
      isActive: true,
    },
    // Lakmé Salon — CG Road Ahmedabad & Mumbai Bandra
    {
      businessId: bizSalon._id,
      name: 'Lakmé Salon CG Road, Ahmedabad',
      address: 'Ground Floor, Abhijit-1 Complex, Mithakhali Six Roads, CG Road, Ahmedabad 380009',
      location: { type: 'Point', coordinates: [72.5569, 23.0433] },
      operatingHours: { open: '10:00', close: '21:00' },
      phone: '+91 79 4000 1111',
      isActive: true,
    },
    {
      businessId: bizSalon._id,
      name: 'Lakmé Salon Bandra West, Mumbai',
      address: 'Shop 12, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
      location: { type: 'Point', coordinates: [72.8296, 19.0596] },
      operatingHours: { open: '10:00', close: '21:00' },
      phone: '+91 22 6500 2222',
      isActive: true,
    },
    // SBI Bank — Ahmedabad Navrangpura & Surat Adajan
    {
      businessId: bizBank._id,
      name: 'SBI Branch Navrangpura, Ahmedabad',
      address: 'Opp. Gujarat University, Navrangpura, Ahmedabad, Gujarat 380009',
      location: { type: 'Point', coordinates: [72.5624, 23.0395] },
      operatingHours: { open: '10:00', close: '16:00' },
      phone: '+91 79 2630 0001',
      isActive: true,
    },
    {
      businessId: bizBank._id,
      name: 'SBI Branch Adajan, Surat',
      address: 'Ambika Niketan Complex, Adajan Road, Surat, Gujarat 395009',
      location: { type: 'Point', coordinates: [72.7932, 21.2131] },
      operatingHours: { open: '10:00', close: '16:00' },
      phone: '+91 261 276 5678',
      isActive: true,
    },
    // Govt Seva Kendra — Gandhinagar
    {
      businessId: bizGovt._id,
      name: 'Aadhar Seva Kendra Gandhinagar Sector 21',
      address: 'Government Building, Sector 21, Gandhinagar, Gujarat 382021',
      location: { type: 'Point', coordinates: [72.6369, 23.2156] },
      operatingHours: { open: '09:30', close: '17:30' },
      phone: '+91 79 2325 0001',
      isActive: true,
    },
    // SmileCare Dental — Satellite Ahmedabad
    {
      businessId: bizDental._id,
      name: 'SmileCare Dental Clinic Satellite, Ahmedabad',
      address: 'B-101 Iscon Elegance, Sarkhej - Gandhinagar Hwy, Satellite, Ahmedabad 380015',
      location: { type: 'Point', coordinates: [72.5088, 23.0257] },
      operatingHours: { open: '09:00', close: '20:00' },
      phone: '+91 79 4005 6789',
      isActive: true,
    },
    // ClearVision Eye Hospital — Prahladnagar Ahmedabad
    {
      businessId: bizEye._id,
      name: 'ClearVision Eye Hospital Prahladnagar, Ahmedabad',
      address: '201 Corporate Road, Prahladnagar, Ahmedabad, Gujarat 380015',
      location: { type: 'Point', coordinates: [72.5049, 23.0188] },
      operatingHours: { open: '09:00', close: '19:00' },
      phone: '+91 79 4006 7890',
      isActive: true,
    },
    // HealthPlus Pharmacy — Maninagar Ahmedabad
    {
      businessId: bizPharm._id,
      name: 'HealthPlus Pharmacy Maninagar, Ahmedabad',
      address: '12 Shivaji Cross Road, Near Railway Station, Maninagar, Ahmedabad 380008',
      location: { type: 'Point', coordinates: [72.6019, 22.9997] },
      operatingHours: { open: '08:00', close: '22:00' },
      phone: '+91 79 4007 8901',
      isActive: true,
    },
  ]);

  console.log('📍  Created branches with GPS coordinates');

  // ── 4. Services ────────────────────────────────────────────────────────────
  const services = await Service.insertMany([
    // Apollo Ahmedabad
    { branchId: brApollo1._id, name: 'General OPD Consultation',     description: 'General physician consultation, prescription & advice.',                   estimatedDurationMinutes: 15, price: 500,  prefix: 'A', isActive: true },
    { branchId: brApollo1._id, name: 'Cardiology Consultation',       description: 'Specialist heart consultation, ECG & stress test.',                         estimatedDurationMinutes: 20, price: 800,  prefix: 'C', isActive: true },
    { branchId: brApollo1._id, name: 'Blood Test & Pathology Lab',    description: 'CBC, blood sugar, lipid profile, thyroid & liver function tests.',          estimatedDurationMinutes: 10, price: 300,  prefix: 'L', isActive: true },
    // Apollo Surat
    { branchId: brApollo2._id, name: 'Emergency OPD',                 description: '24/7 emergency doctor consultation.',                                       estimatedDurationMinutes: 10, price: 700,  prefix: 'E', isActive: true },
    { branchId: brApollo2._id, name: 'Orthopaedic Consultation',      description: 'Bone, joint, fracture & physiotherapy specialist.',                          estimatedDurationMinutes: 20, price: 800,  prefix: 'O', isActive: true },
    // MedPlus Clinic Bopal
    { branchId: brClinic1._id, name: 'General Physician',             description: 'Fever, cold, infections & routine illness consultation.',                   estimatedDurationMinutes: 10, price: 200,  prefix: 'G', isActive: true },
    { branchId: brClinic1._id, name: 'Paediatrics / Child Care',      description: 'Infant, toddler & child health consultations & vaccines.',                   estimatedDurationMinutes: 15, price: 250,  prefix: 'P', isActive: true },
    // MedPlus Clinic Vadodara
    { branchId: brClinic2._id, name: 'Gynaecology Consultation',      description: 'Women\'s health, pregnancy, PCOS & menstrual disorder care.',                estimatedDurationMinutes: 20, price: 400,  prefix: 'F', isActive: true },
    // Lakmé Salon Ahmedabad
    { branchId: brSalon1._id,  name: 'Haircut & Styling',             description: 'Professional haircut, wash, blow-dry & styling for men and women.',          estimatedDurationMinutes: 30, price: 350,  prefix: 'H', isActive: true },
    { branchId: brSalon1._id,  name: 'Facial & Skin Treatment',       description: 'Deep cleansing facial, de-tan, brightening & anti-ageing treatment.',       estimatedDurationMinutes: 45, price: 800,  prefix: 'F', isActive: true },
    { branchId: brSalon1._id,  name: 'Bridal Makeup & Package',       description: 'Complete bridal makeover with hair, makeup, draping & nail art.',           estimatedDurationMinutes: 90, price: 5000, prefix: 'B', isActive: true },
    // Lakmé Salon Mumbai
    { branchId: brSalon2._id,  name: 'Hair Colour & Highlights',      description: 'Global colour, balayage, highlights & toning treatment.',                   estimatedDurationMinutes: 60, price: 1500, prefix: 'C', isActive: true },
    // SBI Ahmedabad
    { branchId: brBank1._id,   name: 'Account Opening',               description: 'New savings / current account opening with KYC.',                           estimatedDurationMinutes: 20, price: 0,    prefix: 'A', isActive: true },
    { branchId: brBank1._id,   name: 'Loan Consultation',             description: 'Home, personal, education & business loan enquiry & processing.',            estimatedDurationMinutes: 30, price: 0,    prefix: 'L', isActive: true },
    { branchId: brBank1._id,   name: 'Cash Deposit / Withdrawal',     description: 'Cash transactions at teller counter.',                                       estimatedDurationMinutes: 5,  price: 0,    prefix: 'T', isActive: true },
    // SBI Surat
    { branchId: brBank2._id,   name: 'Demand Draft & NEFT/RTGS',      description: 'DD issue, NEFT, RTGS & fund transfer services.',                            estimatedDurationMinutes: 15, price: 0,    prefix: 'D', isActive: true },
    // Govt Seva Kendra
    { branchId: brGovt1._id,   name: 'Aadhar Card Update',            description: 'Name, address, mobile, DOB & photo update in Aadhar.',                      estimatedDurationMinutes: 15, price: 50,   prefix: 'A', isActive: true },
    { branchId: brGovt1._id,   name: 'PAN Card Application / Correction', description: 'New PAN, correction & reprint of PAN card.',                            estimatedDurationMinutes: 10, price: 100,  prefix: 'P', isActive: true },
    // Dental
    { branchId: brDental1._id, name: 'Dental Check-Up & Cleaning',    description: 'Full oral examination, scaling & polishing.',                               estimatedDurationMinutes: 30, price: 400,  prefix: 'D', isActive: true },
    { branchId: brDental1._id, name: 'Root Canal Treatment',          description: 'RCT for infected tooth — single or multi-session.',                         estimatedDurationMinutes: 60, price: 3500, prefix: 'R', isActive: true },
    // Eye Hospital
    { branchId: brEye1._id,    name: 'Eye Examination & Refraction',  description: 'Complete eye test, power check & spectacle prescription.',                  estimatedDurationMinutes: 20, price: 300,  prefix: 'E', isActive: true },
    { branchId: brEye1._id,    name: 'Cataract Screening',            description: 'Slit lamp examination & cataract evaluation.',                              estimatedDurationMinutes: 25, price: 500,  prefix: 'C', isActive: true },
    // Pharmacy
    { branchId: brPharm1._id,  name: 'Doctor Consultation',           description: 'Quick 10-min consultation with an in-house general physician.',             estimatedDurationMinutes: 10, price: 150,  prefix: 'D', isActive: true },
    { branchId: brPharm1._id,  name: 'Home Lab Sample Collection',    description: 'Book a slot for a lab technician to collect your blood sample at home.',    estimatedDurationMinutes: 15, price: 200,  prefix: 'L', isActive: true },
  ]);

  console.log('⚕️   Created services');

  // Helper: find service by branch and index
  const svc = (branchId, idx) =>
    services.filter(s => s.branchId.equals(branchId))[idx];

  // ── 5. Queues & Tokens for TODAY ────────────────────────────────────────────
  const makeQueue = async (branch, serviceIdx, currentSeq, totalIssued) => {
    const service = svc(branch._id, serviceIdx);
    const paddedCurrent = `${service.prefix}-${String(currentSeq).padStart(3, '0')}`;
    const q = await Queue.create({
      branchId: branch._id,
      serviceId: service._id,
      date: today(),
      status: 'OPEN',
      totalTokensIssued: totalIssued,
      currentTokenNumber: paddedCurrent,
    });
    return { q, service };
  };

  const makeTokens = async (queue, service, currentSeq, totalIssued) => {
    const tokens = [];
    for (let seq = 1; seq <= totalIssued; seq++) {
      const tokenNumber = `${service.prefix}-${String(seq).padStart(3, '0')}`;
      let status, calledAt, completedAt, waitMins;

      if (seq < currentSeq) {
        status = 'COMPLETED';
        calledAt = minsAgo((totalIssued - seq + 1) * 12);
        completedAt = minsAgo((totalIssued - seq) * 12);
        waitMins = 0;
      } else if (seq === currentSeq) {
        status = 'CALLED';
        calledAt = minsAgo(5);
        waitMins = 0;
      } else {
        status = 'WAITING';
        waitMins = (seq - currentSeq) * service.estimatedDurationMinutes;
      }

      tokens.push({
        queueId: queue._id,
        tokenNumber,
        sequenceNumber: seq,
        userId: customer._id,
        forPersonName: seq % 3 === 0 ? 'Family Member' : 'Myself',
        status,
        estimatedWaitTimeMinutes: waitMins,
        calledAt: calledAt || undefined,
        completedAt: completedAt || undefined,
      });
    }
    const created = await Token.insertMany(tokens);
    // Set currentTokenId
    const currentToken = created.find(t => t.sequenceNumber === currentSeq);
    if (currentToken) {
      queue.currentTokenId = currentToken._id;
      await queue.save();
    }
  };

  // Apollo Ahmedabad — OPD queue (busy, 12 tokens, currently on #8)
  const { q: q1, service: s1 } = await makeQueue(brApollo1, 0, 8, 12);
  await makeTokens(q1, s1, 8, 12);

  // Apollo Ahmedabad — Lab queue (5 tokens, on #3)
  const { q: q2, service: s2 } = await makeQueue(brApollo1, 2, 3, 5);
  await makeTokens(q2, s2, 3, 5);

  // Apollo Surat — Emergency OPD (4 tokens, on #2)
  const { q: q3, service: s3 } = await makeQueue(brApollo2, 0, 2, 4);
  await makeTokens(q3, s3, 2, 4);

  // MedPlus Bopal — General Physician (8 tokens, on #5)
  const { q: q4, service: s4 } = await makeQueue(brClinic1, 0, 5, 8);
  await makeTokens(q4, s4, 5, 8);

  // MedPlus Bopal — Paediatrics (3 tokens, on #1)
  const { q: q5, service: s5 } = await makeQueue(brClinic1, 1, 1, 3);
  await makeTokens(q5, s5, 1, 3);

  // Lakmé Salon Ahmedabad — Haircut (6 tokens, on #4)
  const { q: q6, service: s6 } = await makeQueue(brSalon1, 0, 4, 6);
  await makeTokens(q6, s6, 4, 6);

  // Lakmé Salon Ahmedabad — Facial (4 tokens, on #2)
  const { q: q7, service: s7 } = await makeQueue(brSalon1, 1, 2, 4);
  await makeTokens(q7, s7, 2, 4);

  // SBI Ahmedabad — Cash/Teller (15 tokens, on #10)
  const { q: q8, service: s8 } = await makeQueue(brBank1, 2, 10, 15);
  await makeTokens(q8, s8, 10, 15);

  // SBI Ahmedabad — Loan (5 tokens, on #3)
  const { q: q9, service: s9 } = await makeQueue(brBank1, 1, 3, 5);
  await makeTokens(q9, s9, 3, 5);

  // Govt Seva Kendra — Aadhar Update (10 tokens, on #6)
  const { q: q10, service: s10 } = await makeQueue(brGovt1, 0, 6, 10);
  await makeTokens(q10, s10, 6, 10);

  // SmileCare Dental — Check-up (5 tokens, on #3)
  const { q: q11, service: s11 } = await makeQueue(brDental1, 0, 3, 5);
  await makeTokens(q11, s11, 3, 5);

  // ClearVision Eye — Eye Exam (7 tokens, on #4)
  const { q: q12, service: s12 } = await makeQueue(brEye1, 0, 4, 7);
  await makeTokens(q12, s12, 4, 7);

  // HealthPlus Pharmacy — Doctor (4 tokens, on #2)
  const { q: q13, service: s13 } = await makeQueue(brPharm1, 0, 2, 4);
  await makeTokens(q13, s13, 2, 4);

  console.log('🎫  Created queues and tokens for today');

  // ── Summary ──────────────────────────────────────────────────────────────
  const stats = {
    users: await User.countDocuments(),
    businesses: await Business.countDocuments(),
    branches: await Branch.countDocuments(),
    services: await Service.countDocuments(),
    queues: await Queue.countDocuments(),
    tokens: await Token.countDocuments(),
  };

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('          ✅  QueueLess Database Seeded Successfully!       ');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  Users: ${stats.users}  |  Businesses: ${stats.businesses}  |  Branches: ${stats.branches}`);
  console.log(`  Services: ${stats.services}  |  Queues: ${stats.queues}  |  Tokens: ${stats.tokens}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log('  🔑  Demo Login Credentials');
  console.log('  Customer  → customer@queueless.io   / Customer123!');
  console.log('  Hospital  → hospital@queueless.io   / Admin123!');
  console.log('  Clinic    → clinic@queueless.io     / Admin123!');
  console.log('  Salon     → salon@queueless.io      / Admin123!');
  console.log('  Bank      → bank@queueless.io       / Admin123!');
  console.log('  Govt      → govt@queueless.io       / Admin123!');
  console.log('  Dental    → dental@queueless.io     / Admin123!');
  console.log('  Eye       → eye@queueless.io        / Admin123!');
  console.log('  Pharmacy  → pharmacy@queueless.io   / Admin123!');
  console.log('────────────────────────────────────────────────────────────');
  console.log('  📍  Real GPS Locations (Gujarat & Mumbai)');
  console.log('  Apollo Ahmedabad → 23.0760° N, 72.5714° E');
  console.log('  Apollo Surat     → 21.1702° N, 72.8347° E');
  console.log('  MedPlus Bopal    → 23.0364° N, 72.4695° E');
  console.log('  Lakmé CG Road    → 23.0433° N, 72.5569° E');
  console.log('  SBI Navrangpura  → 23.0395° N, 72.5624° E');
  console.log('════════════════════════════════════════════════════════════\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
