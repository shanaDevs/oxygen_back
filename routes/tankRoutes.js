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
 *           description: Tank ID
 *         name:
 *           type: string
 *           description: Tank name
 *         capacityLiters:
 *           type: number
 *           description: Maximum tank capacity in liters
 *         currentLevelLiters:
 *           type: number
 *           description: Current oxygen level in liters
 *         lastRefillDate:
 *           type: string
 *           format: date-time
 *           description: Last refill date
 *         lastRefillAmount:
 *           type: number
 *           description: Amount of last refill in liters
 *     TankHistory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         operationType:
 *           type: string
 *           enum: [refill, fill_bottles, adjustment]
 *         litersBefore:
 *           type: number
 *         litersChanged:
 *           type: number
 *         litersAfter:
 *           type: number
 *         supplierId:
 *           type: string
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tank:
 *   get:
 *     summary: Get main tank status
 *     tags: [Tank]
 *     responses:
 *       200:
 *         description: Current tank status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MainTank'
 */
router.get('/', tankController.getTankStatus);

/**
 * @swagger
 * /api/tank:
 *   put:
 *     summary: Manually update tank level (adjustment)
 *     tags: [Tank]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentLevelLiters
 *             properties:
 *               currentLevelLiters:
 *                 type: number
 *                 description: New tank level in liters
 *               notes:
 *                 type: string
 *                 description: Reason for adjustment
 *     responses:
 *       200:
 *         description: Tank level updated successfully
 *       400:
 *         description: Invalid level (exceeds capacity or negative)
 */
router.put('/', tankController.updateTankLevel);

/**
 * @swagger
 * /api/tank/refill:
 *   post:
 *     summary: Refill tank from supplier delivery
 *     tags: [Tank]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - litersSupplied
 *               - pricePerLiter
 *             properties:
 *               supplierId:
 *                 type: string
 *                 description: Supplier ID
 *               litersSupplied:
 *                 type: number
 *                 description: Liters of oxygen delivered
 *               pricePerLiter:
 *                 type: number
 *                 description: Price per liter
 *               amountPaid:
 *                 type: number
 *                 description: Amount paid (default 0)
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tank refilled and supplier transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     tankLevelBefore:
 *                       type: number
 *                     tankLevelAfter:
 *                       type: number
 *                     supplierTransaction:
 *                       type: object
 *       400:
 *         description: Refill would exceed tank capacity
 */
router.post('/refill', tankController.refillTank);

/**
 * @swagger
 * /api/tank/history:
 *   get:
 *     summary: Get tank operation history
 *     tags: [Tank]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of tank operations
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
 *                     $ref: '#/components/schemas/TankHistory'
 */
router.get('/history', tankController.getTankHistory);

/**
 * @swagger
 * /api/tank/fill-history:
 *   get:
 *     summary: Get tank fill/refill history
 *     tags: [Tank]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of tank refill events with supplier and payment info
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       mainTankId:
 *                         type: string
 *                       supplierId:
 *                         type: string
 *                       supplierName:
 *                         type: string
 *                       supplierPhone:
 *                         type: string
 *                       litersAdded:
 *                         type: number
 *                       previousLevel:
 *                         type: number
 *                       newLevel:
 *                         type: number
 *                       totalAmount:
 *                         type: number
 *                       amountPaid:
 *                         type: number
 *                       outstanding:
 *                         type: number
 *                       paymentStatus:
 *                         type: string
 *                         enum: [full, partial, outstanding, unknown]
 *                       notes:
 *                         type: string
 *                       filledAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/fill-history', tankController.getTankFillHistory);

module.exports = router;
