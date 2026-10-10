const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize, canAccessResource } = require('../middleware/auth');
const logger = require('../config/logger');
const { cacheResponse, getCachedResponse, del, delByPrefix } = require('../config/redis');

const clearVendorCache = async (id) => {
  await delByPrefix('vendors:');
  if (id) await del(`vendor:${id}`);
};

// Request field -> vendors column. Accepts both the API's camelCase and raw column names.
const UPDATABLE_FIELDS = {
  name: 'name',
  category: 'category',
  status: 'status',
  taxId: 'tax_id', tax_id: 'tax_id',
  registrationNumber: 'registration_number', registration_number: 'registration_number',
  website: 'website',
  description: 'description',
  totalSpend: 'total_spend', total_spend: 'total_spend',
  rating: 'rating',
  contractsCount: 'contracts_count', contracts_count: 'contracts_count',
  onboardDate: 'onboard_date', onboard_date: 'onboard_date',
  isActive: 'is_active', is_active: 'is_active',
  contact: 'contact_info', contact_info: 'contact_info',
  bankDetails: 'bank_details', bank_details: 'bank_details',
  complianceInfo: 'compliance_info', compliance_info: 'compliance_info'
};
const JSON_COLUMNS = ['contact_info', 'bank_details', 'compliance_info'];

const router = express.Router();

const { db } = require('../config/database');
const { getVendorPerformance, getPerformanceOverview } = require('../services/vendorPerformance');

class Vendor {
  static async findAll(filters = {}) {
    const query = db('vendors').select('*');
    if (filters.status) query.where('status', filters.status);
    if (filters.category) query.where('category', filters.category);
    if (filters.search) query.where('name', 'ilike', `%${filters.search}%`);
    const vendors = await query.limit(filters.limit).offset((filters.page - 1) * filters.limit);
    return {
      vendors,
      pagination: { page: filters.page, limit: filters.limit, total: vendors.length, totalPages: 1 }
    };
  }

  static async findById(id) {
    const vendor = await db('vendors').where({ id }).first();
    return vendor;
  }

  static async create(vendorData) {
    const [newVendor] = await db('vendors').insert(vendorData).returning('*');
    return newVendor;
  }

  static async update(id, updateData) {
    const [updated] = await db('vendors').where({ id }).update(updateData).returning('*');
    return updated;
  }

  static async delete(id) {
    await db('vendors').where({ id }).del();
    return true;
  }
}

/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [technology, manufacturing, services, materials, logistics, consulting, other]
 *         description: Vendor category filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, under_review, rejected, inactive, suspended]
 *         description: Vendor status filter
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vendors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vendor'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 */
router.get('/', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('category').optional().isIn(['technology', 'manufacturing', 'services', 'materials', 'logistics', 'consulting', 'other']),
  query('status').optional().isIn(['active', 'under_review', 'rejected', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { page = 1, limit = 10, search, category, status } = req.query;

    // Check cache first
    const cacheKey = `vendors:${JSON.stringify(req.query)}`;
    const cached = await getCachedResponse(cacheKey, 300); // 5 minutes cache
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const result = await Vendor.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category,
      status
    });

    // Cache the response
    await cacheResponse(cacheKey, result, 300);

    logger.logAudit('VENDORS_VIEWED', req.user.id, {
      filters: req.query,
      ip: req.ip
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vendors/performance/overview:
 *   get:
 *     summary: Performance, scoring and risk for every vendor, derived from vendor, PO, invoice, quotation and dispute records
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio summary plus one scored row per vendor
 */
router.get('/performance/overview', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer')
], async (req, res) => {
  try {
    const data = await getPerformanceOverview();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get vendor performance overview error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/{id}/performance:
 *   get:
 *     summary: Performance, analytics, scorecard, insights and actions for one vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vendor performance retrieved
 *       404:
 *         description: Vendor not found
 */
router.get('/:id/performance', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  canAccessResource('vendor', 'id')
], async (req, res) => {
  try {
    const data = await getVendorPerformance(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get vendor performance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', [
  authenticate,
  authorize('admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'viewer'),
  canAccessResource('vendor', 'id')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `vendor:${id}`;
    const cached = await getCachedResponse(cacheKey, 600); // 10 minutes cache
    if (cached) {
      return res.json({
        success: true,
        data: cached
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Cache the response
    await cacheResponse(cacheKey, vendor, 600);

    logger.logAudit('VENDOR_VIEWED', req.user.id, {
      vendorId: id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vendors:
 *   post:
 *     summary: Create new vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 description: Vendor company name
 *               category:
 *                 type: string
 *                 enum: [technology, manufacturing, services, materials, logistics, consulting, other]
 *                 description: Vendor business category
 *               contact:
 *                 $ref: '#/components/schemas/ContactInfo'
 *               taxId:
 *                 type: string
 *                 description: Tax identification number
 *               registrationNumber:
 *                 type: string
 *                 description: Business registration number
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Company website
 *               description:
 *                 type: string
 *                 description: Company description
 *               bankDetails:
 *                 type: object
 *                 description: Bank account details
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', [
  authenticate,
  authorize('admin', 'procurement_manager'),
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('category').isIn(['technology', 'manufacturing', 'services', 'materials', 'logistics', 'consulting', 'other']),
  body('contact.email').isEmail().normalizeEmail(),
  body('contact.phone').optional().isMobilePhone(),
  body('taxId').optional().trim(),
  body('registrationNumber').optional().trim(),
  body('website').optional().isURL(),
  body('description').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const vendorData = {
      id: uuidv4(),
      name: req.body.name,
      category: req.body.category || 'technology',
      contact_info: JSON.stringify(req.body.contact || {}),
      tax_id: req.body.taxId || null,
      registration_number: req.body.registrationNumber || null,
      website: req.body.website || null,
      description: req.body.description || null,
      bank_details: req.body.bankDetails ? JSON.stringify(req.body.bankDetails) : null,
      status: 'under_review',
      created_by: req.user.id
    };

    const vendor = await Vendor.create(vendorData);

    await clearVendorCache();

    logger.logAudit('VENDOR_CREATED', req.user.id, {
      vendorId: vendor.id,
      vendorName: vendor.name,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   put:
 *     summary: Update vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               category:
 *                 type: string
 *                 enum: [technology, manufacturing, services, materials, logistics, consulting, other]
 *               contact:
 *                 $ref: '#/components/schemas/ContactInfo'
 *               status:
 *                 type: string
 *                 enum: [active, under_review, rejected, inactive, suspended]
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vendor'
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', [
  authenticate,
  authorize('admin', 'procurement_manager'),
  canAccessResource('vendor', 'id'),
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('category').optional().isIn(['technology', 'manufacturing', 'services', 'materials', 'logistics', 'consulting', 'other']),
  body('status').optional().isIn(['active', 'under_review', 'rejected', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      updated_by: req.user.id,
      updated_at: new Date()
    };
    for (const [field, value] of Object.entries(req.body)) {
      const column = UPDATABLE_FIELDS[field];
      if (!column) continue;
      updateData[column] = JSON_COLUMNS.includes(column) && value !== null && typeof value === 'object'
        ? JSON.stringify(value)
        : value;
    }

    const vendor = await Vendor.update(id, updateData);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    await clearVendorCache(id);

    logger.logAudit('VENDOR_UPDATED', req.user.id, {
      vendorId: id,
      changes: req.body,
      ip: req.ip
    });

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vendors/{id}:
 *   delete:
 *     summary: Delete vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Vendor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', [
  authenticate,
  authorize('admin'),
  canAccessResource('vendor', 'id')
], async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Vendor.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    await Vendor.delete(id);
    await clearVendorCache(id);

    logger.logAudit('VENDOR_DELETED', req.user.id, {
      vendorId: id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    logger.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
