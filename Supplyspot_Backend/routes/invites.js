const express = require('express');
const { body, validationResult } = require('express-validator');
const Invite = require('../models/invite');
const logger = require('../config/logger');
const { authenticate, authorize } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InviteRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Optional email to restrict invite to specific user
 *         role:
 *           type: string
 *           enum: [admin, procurement_manager, finance_manager, ap_clerk, supplier, viewer]
 *           description: Role assigned to user who uses this invite
 *         maxUses:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Maximum number of times this invite can be used
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date for this invite
 *         notes:
 *           type: string
 *           description: Optional notes about this invite
 */

/**
 * @swagger
 * /invites:
 *   post:
 *     summary: Create a new invite
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteRequest'
 *     responses:
 *       201:
 *         description: Invite created successfully
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
 *                     invite:
 *                       $ref: '#/components/schemas/Invite'
 *                     inviteLink:
 *                       type: string
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
  body('email').optional().isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'supplier', 'viewer']),
  body('maxUses').optional().isInt({ min: 1, max: 100 }),
  body('expiresAt').optional().isISO8601().toDate(),
  body('notes').optional().trim().isLength({ max: 500 })
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

    const { email, role, maxUses, expiresAt, notes } = req.body;

    // Create invite
    const invite = await new Invite(db).create({
      email,
      role,
      max_uses: maxUses || 1,
      expires_at: expiresAt,
      notes,
      created_by: req.user.id
    });

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?invite=${invite.invite_code}`;

    logger.logAudit('INVITE_CREATED', req.user.id, {
      inviteId: invite.id,
      inviteCode: invite.invite_code,
      email: invite.email,
      role: invite.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        invite,
        inviteLink
      }
    });
  } catch (error) {
    logger.error('Create invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /invites:
 *   get:
 *     summary: Get all invites created by current user
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invite'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', [
  authenticate,
  authorize('admin', 'procurement_manager')
], async (req, res) => {
  try {
    const invites = await new Invite(db).getInvitesByCreator(req.user.id);

    // Generate invite links for each invite
    const invitesWithLinks = invites.map(invite => ({
      ...invite,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?invite=${invite.invite_code}`
    }));

    res.json({
      success: true,
      data: invitesWithLinks
    });
  } catch (error) {
    logger.error('Get invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /invites/{id}:
 *   delete:
 *     summary: Delete an invite
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invite ID
 *     responses:
 *       200:
 *         description: Invite deleted successfully
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
 *         description: Invite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions or invite already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', [
  authenticate,
  authorize('admin', 'procurement_manager')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invite exists and belongs to user
    const invite = await req.db('invites')
      .where('id', id)
      .where('created_by', req.user.id)
      .first();

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found'
      });
    }

    // Don't allow deletion of used invites
    if (invite.status === 'used') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete invite that has already been used'
      });
    }

    // Delete invite
    await new Invite(db).deleteInvite(id);

    logger.logAudit('INVITE_DELETED', req.user.id, {
      inviteId: id,
      inviteCode: invite.invite_code,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Invite deleted successfully'
    });
  } catch (error) {
    logger.error('Delete invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /invites/stats:
 *   get:
 *     summary: Get invite statistics
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalInvites:
 *                       type: integer
 *                     activeInvites:
 *                       type: integer
 *                     usedInvites:
 *                       type: integer
 *                     expiredInvites:
 *                       type: integer
 *                     totalUsersRegistered:
 *                       type: integer
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', [
  authenticate,
  authorize('admin', 'procurement_manager')
], async (req, res) => {
  try {
    const stats = await req.db('invites')
      .where('created_by', req.user.id)
      .select(
        req.db.raw('COUNT(*) as total_invites'),
        req.db.raw('COUNT(*) FILTER (WHERE status = \'active\') as active_invites'),
        req.db.raw('COUNT(*) FILTER (WHERE status = \'used\') as used_invites'),
        req.db.raw('COUNT(*) FILTER (WHERE status = \'expired\' OR (expires_at IS NOT NULL AND expires_at < NOW())) as expired_invites'),
        req.db.raw('COUNT(DISTINCT used_by) FILTER (WHERE used_by IS NOT NULL) as total_users_registered')
      )
      .first();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get invite stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
