const Business = require('../models/Business');
const Branch = require('../models/Branch');

// @desc    Get all businesses with optional category filter and search term
// @route   GET /api/businesses
// @access  Public
const getBusinesses = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const businesses = await Business.find(query).populate('ownerId', 'name email');
    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
};

const Queue = require('../models/Queue');
const Token = require('../models/Token');
const Service = require('../models/Service');

// Haversine distance calculator in KM
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Get nearby businesses based on lat/lng coordinates
// @route   GET /api/businesses/nearby
// @access  Public
const getNearbyBusinesses = async (req, res, next) => {
  try {
    const latParam = req.query.latitude || req.query.lat;
    const lngParam = req.query.longitude || req.query.lng;
    const { category, search, radius, maxDistanceKm = 50 } = req.query;

    if (!latParam || !lngParam) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude query parameters',
      });
    }

    const customerLat = parseFloat(latParam);
    const customerLng = parseFloat(lngParam);

    if (isNaN(customerLat) || isNaN(customerLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values',
      });
    }

    const distanceLimitKm = radius ? parseFloat(radius) / 1000 : parseFloat(maxDistanceKm);
    const maxDistanceMeters = distanceLimitKm * 1000;

    // Geospatial query on Branch location with 2dsphere index
    const branches = await Branch.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [customerLng, customerLat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isActive: true,
    }).populate({
      path: 'businessId',
      match: { status: 'ACTIVE' },
    });

    // Filter out branches whose business is not active or missing
    const activeBranches = branches.filter((b) => b.businessId != null);

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute live metrics for each branch
    const enrichedBranches = await Promise.all(
      activeBranches.map(async (branch) => {
        const biz = branch.businessId;
        const [branchLng, branchLat] = branch.location.coordinates;
        const distanceKm = calculateHaversineKm(customerLat, customerLng, branchLat, branchLng);

        // Fetch services & today's queues for this branch
        const services = await Service.find({ branchId: branch._id, isActive: true });
        const serviceIds = services.map((s) => s._id);

        const queues = await Queue.find({
          branchId: branch._id,
          serviceId: { $in: serviceIds },
          date: todayStr,
        });

        const queueIds = queues.map((q) => q._id);
        const waitingCount = await Token.countDocuments({
          queueId: { $in: queueIds },
          status: 'WAITING',
        });

        // Current serving tokens summary
        const activeServingTokens = queues
          .filter((q) => q.currentTokenNumber)
          .map((q) => q.currentTokenNumber);

        // Compute average estimated wait
        const avgDuration =
          services.length > 0
            ? services.reduce((acc, s) => acc + s.estimatedDurationMinutes, 0) / services.length
            : 15;
        const estimatedWaitMinutes = Math.round(waitingCount * avgDuration);

        return {
          _id: branch._id,
          branchName: branch.name,
          address: branch.address,
          city: branch.city || '',
          state: branch.state || '',
          pincode: branch.pincode || '',
          landmark: branch.landmark || '',
          phone: branch.phone || (biz ? biz.phone : ''),
          email: branch.email || (biz ? biz.email : ''),
          website: branch.website || (biz ? biz.website : ''),
          location: branch.location,
          operatingHours: branch.operatingHours,
          distanceKm,
          business: {
            _id: biz._id,
            name: biz.name,
            category: biz.category,
            description: biz.description,
            logoUrl: biz.logoUrl,
            rating: biz.rating || 0.0,
            reviewCount: biz.reviewCount || 0,
            status: biz.status,
          },
          queueSummary: {
            totalWaiting: waitingCount,
            estimatedWaitMinutes,
            currentServingToken: activeServingTokens.length > 0 ? activeServingTokens[0] : null,
            openQueuesCount: queues.filter((q) => q.status === 'OPEN').length,
          },
        };
      })
    );

    // Apply optional category and search filters
    let filtered = enrichedBranches;

    if (category && category !== 'All') {
      filtered = filtered.filter((b) => b.business.category === category);
    }

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.business.name.toLowerCase().includes(s) ||
          b.branchName.toLowerCase().includes(s) ||
          b.address.toLowerCase().includes(s) ||
          b.business.category.toLowerCase().includes(s)
      );
    }

    // Sort by distance ascending
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single business by ID with branches
// @route   GET /api/businesses/:id
// @access  Public
const getBusinessById = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('ownerId', 'name email');
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const branches = await Branch.find({ businessId: business._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        ...business.toObject(),
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new business
// @route   POST /api/businesses
// @access  Protected (Admin)
const createBusiness = async (req, res, next) => {
  try {
    const { name, description, category, logoUrl } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business name and category',
      });
    }

    const business = await Business.create({
      name,
      description: description || '',
      category,
      logoUrl: logoUrl || '',
      ownerId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business
// @route   PATCH /api/businesses/:id
// @access  Protected (Admin / Owner)
const updateBusiness = async (req, res, next) => {
  try {
    const { name, description, category, logoUrl, phone, email, website, status } = req.body;
    const business = req.business || (await Business.findById(req.params.id));

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    if (name) business.name = name.trim();
    if (description !== undefined) business.description = description.trim();
    if (category) business.category = category;
    if (logoUrl !== undefined) business.logoUrl = logoUrl;
    if (phone !== undefined) business.phone = phone.trim();
    if (email !== undefined) business.email = email.trim().toLowerCase();
    if (website !== undefined) business.website = website.trim();
    if (status && ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].includes(status)) {
      business.status = status;
    }

    await business.save();

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current Shop Admin's owned businesses with branches
// @route   GET /api/businesses/me/admin
// @access  Protected (Admin)
const getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find({ ownerId: req.user.id });
    const bizIds = businesses.map((b) => b._id);
    const branches = await Branch.find({ businessId: { $in: bizIds } });

    res.status(200).json({
      success: true,
      count: businesses.length,
      data: {
        businesses,
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinesses,
  getNearbyBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  getMyBusinesses,
};
