const express = require('express');
const router = express.Router();
const tankController = require('../controllers/tankController');

/**
 * @swagger
 * components:
 *   schemas:
 *     MainTank:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         capacityTons:
 *           type: number
 *           description: Tank capacity in tons
 *         currentLevelKg:
 *           type: number
 *           description: Current oxygen level in kg
 *         capacityKg:
 *           type: number
 *           description: Calculated capacity in kg
 *         percentFull:
 *           type: number
 *         lowLevelAlertKg:
 *           type: number
 *         criticalLevelAlertKg:
 *           type: number
 */

/**
 * @swagger
 * /api/tank:
 *   get:
 *     summary: Get tank information (alias for /status)
 *     tags: [Tank]
 */
router.get('/', tankController.getTankStatus);

/**
 * @swagger
 * /api/tank/status:
 *   get:
 *     summary: Get tank status
 *     tags: [Tank]
 */
router.get('/status', tankController.getTankStatus);

/**
 * @swagger
 * /api/tank/statistics:
 *   get:
 *     summary: Get tank statistics
 *     tags: [Tank]
 */
router.get('/statistics', tankController.getTankStatistics);

/**
 * @swagger
 * /api/tank/history:
 *   get:
 *     summary: Get tank history
 *     tags: [Tank]
 */
router.get('/history', tankController.getTankHistory);

/**
 * @swagger
 * /api/tank/fill-history:
 *   get:
 *     summary: Get tank refill history
 *     tags: [Tank]
 */
router.get('/fill-history', tankController.getTankFillHistory);

/**
 * @swagger
 * /api/tank/usage-history:
 *   get:
 *     summary: Get tank usage history (bottle fills)
 *     tags: [Tank]
 */
router.get('/usage-history', tankController.getTankUsageHistory);

/**
 * @swagger
 * /api/tank/settings:
 *   put:
 *     summary: Update tank settings
 *     tags: [Tank]
 */
router.put('/settings', tankController.updateTankSettings);

/**
 * @swagger
 * /api/tank/level:
 *   put:
 *     summary: Update tank level (manual adjustment)
 *     tags: [Tank]
 */
router.put('/level', tankController.updateTankLevel);

/**
 * @swagger
 * /api/tank/refill:
 *   post:
 *     summary: Refill tank from supplier
 *     tags: [Tank]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - kgSupplied
 *             properties:
 *               supplierId:
 *                 type: string
 *               kgSupplied:
 *                 type: number
 *               pricePerKg:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, partial, full]
 *               notes:
 *                 type: string
 */
router.post('/refill', tankController.refillTank);

module.exports = router;
