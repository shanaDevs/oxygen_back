const express = require('express');
const router = express.Router();
const bottleController = require('../controllers/bottleController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Bottle:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Bottle ID
 *         serialNumber:
 *           type: string
 *           description: Unique serial number (e.g., OXY-0001)
 *         capacityLiters:
 *           type: number
 *           description: Bottle capacity in liters
 *         bottleTypeId:
 *           type: string
 *           description: Reference to bottle type
 *         status:
 *           type: string
 *           enum: [empty, filled, with_customer]
 *           description: Current bottle status
 *         customerId:
 *           type: string
 *           description: Customer ID if bottle is with customer
 *         customerName:
 *           type: string
 *           description: Customer name if bottle is with customer
 *         filledDate:
 *           type: string
 *           format: date-time
 *           description: Date when bottle was last filled
 *         issuedDate:
 *           type: string
 *           format: date-time
 *           description: Date when bottle was issued to customer
 */

/**
 * @swagger
 * /api/bottles:
 *   get:
 *     summary: Get all bottles
 *     tags: [Bottles]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [empty, filled, with_customer]
 *         description: Filter by bottle status
 *     responses:
 *       200:
 *         description: List of bottles
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
 *                     $ref: '#/components/schemas/Bottle'
 */
router.get('/', bottleController.getAllBottles);



/**
 * @swagger
 * /api/bottles:
 *   post:
 *     summary: Create a new bottle
 *     tags: [Bottles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *               - capacityLiters
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 description: Unique serial number
 *               capacityLiters:
 *                 type: number
 *                 description: Bottle capacity in liters
 *               bottleTypeId:
 *                 type: string
 *                 description: Bottle type ID
 *               status:
 *                 type: string
 *                 enum: [empty, filled]
 *                 default: empty
 *     responses:
 *       201:
 *         description: Bottle created successfully
 *       400:
 *         description: Validation error or serial number already exists
 */
router.post('/', bottleController.createBottle);



/**
 * @swagger
 * /api/bottles/fill:
 *   post:
 *     summary: Fill multiple empty bottles from main tank
 *     tags: [Bottles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bottleIds
 *             properties:
 *               bottleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of bottle IDs to fill
 *     responses:
 *       200:
 *         description: Bottles filled successfully, tank level reduced
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
 *                     bottlesFilled:
 *                       type: integer
 *                     litersUsed:
 *                       type: number
 *                     tankLevelBefore:
 *                       type: number
 *                     tankLevelAfter:
 *                       type: number
 *       400:
 *         description: Insufficient tank level or bottles not available
 */
router.post('/fill', bottleController.fillBottles);

/**
 * @swagger
 * /api/bottles/fill-history:
 *   get:
 *     summary: Get bottle fill history
 *     tags: [Bottles]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of bottle fill events
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
 *                       bottleId:
 *                         type: string
 *                       serialNumber:
 *                         type: string
 *                       capacityLiters:
 *                         type: number
 *                       litersUsed:
 *                         type: number
 *                       tankHistoryId:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       filledAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/fill-history', bottleController.getBottleFillHistory);

/**
 * @swagger
 * components:
 *   schemas:
 *     BottleLedgerEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Ledger entry ID
 *         bottleId:
 *           type: string
 *           description: Reference to bottle
 *         serialNumber:
 *           type: string
 *           description: Bottle serial number
 *         operationType:
 *           type: string
 *           enum: [created, filled, issued, returned, refilled, updated, deleted, adjustment]
 *           description: Type of operation performed
 *         previousStatus:
 *           type: string
 *           description: Bottle status before operation
 *         newStatus:
 *           type: string
 *           description: Bottle status after operation
 *         customerId:
 *           type: string
 *           description: Related customer ID (if applicable)
 *         customerName:
 *           type: string
 *           description: Related customer name (if applicable)
 *         transactionId:
 *           type: string
 *           description: Related transaction ID (if applicable)
 *         tankHistoryId:
 *           type: string
 *           description: Related tank history ID (if applicable)
 *         litersUsed:
 *           type: number
 *           description: Liters of oxygen used (for filling)
 *         amount:
 *           type: number
 *           description: Amount associated with operation
 *         notes:
 *           type: string
 *           description: Additional notes
 *         performedBy:
 *           type: string
 *           description: User who performed the operation
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bottles/ledger:
 *   get:
 *     summary: Get all bottle ledger entries
 *     tags: [Bottle Ledger]
 *     parameters:
 *       - in: query
 *         name: bottleId
 *         schema:
 *           type: string
 *         description: Filter by bottle ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: operationType
 *         schema:
 *           type: string
 *           enum: [created, filled, issued, returned, refilled, updated, deleted, adjustment]
 *         description: Filter by operation type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum entries to return
 *     responses:
 *       200:
 *         description: List of ledger entries
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
 *                     $ref: '#/components/schemas/BottleLedgerEntry'
 */
router.get('/ledger', bottleController.getAllLedgerEntries);

/**
 * @swagger
 * /api/bottles/ledger/summary:
 *   get:
 *     summary: Get ledger summary and statistics
 *     tags: [Bottle Ledger]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Ledger summary
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
 *                     operationCounts:
 *                       type: object
 *                       description: Count of each operation type
 *                     totalLitersUsed:
 *                       type: number
 *                       description: Total liters used in filling operations
 *                     totalAmount:
 *                       type: number
 *                       description: Total amount from all operations
 *                     recentEntries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BottleLedgerEntry'
 */
router.get('/ledger/summary', bottleController.getLedgerSummary);

/**
 * @swagger
 * /api/bottles/{id}:
 *   get:
 *     summary: Get bottle by ID
 *     tags: [Bottles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bottle details
 *       404:
 *         description: Bottle not found
 */
router.get('/:id', bottleController.getBottleById);

/**
 * @swagger
 * /api/bottles/{id}:
 *   put:
 *     summary: Update bottle
 *     tags: [Bottles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serialNumber:
 *                 type: string
 *               capacityLiters:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [empty, filled, with_customer]
 *     responses:
 *       200:
 *         description: Bottle updated successfully
 *       404:
 *         description: Bottle not found
 */
router.put('/:id', bottleController.updateBottle);

/**
 * @swagger
 * /api/bottles/{id}/ledger:
 *   get:
 *     summary: Get ledger history for a specific bottle
 *     tags: [Bottle Ledger]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bottle ID
 *     responses:
 *       200:
 *         description: Bottle details with full ledger history
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
 *                     bottle:
 *                       $ref: '#/components/schemas/Bottle'
 *                     ledger:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BottleLedgerEntry'
 *       404:
 *         description: Bottle not found
 */
router.get('/:id/ledger', bottleController.getBottleLedger);

module.exports = router;
