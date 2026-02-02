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
 *         serialNumber:
 *           type: string
 *         capacityLiters:
 *           type: number
 *         bottleTypeId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [empty, filled, with_customer, maintenance, retired]
 *         location:
 *           type: string
 *           enum: [center, customer]
 *         customerId:
 *           type: string
 *         customerName:
 *           type: string
 *         ownerId:
 *           type: string
 *         ownerName:
 *           type: string
 *         filledDate:
 *           type: string
 *           format: date-time
 *         issuedDate:
 *           type: string
 *           format: date-time
 *         fillCount:
 *           type: integer
 *         issueCount:
 *           type: integer
 *     BottleType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         capacityLiters:
 *           type: number
 *         refillKg:
 *           type: number
 *         pricePerFill:
 *           type: number
 *         depositAmount:
 *           type: number
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 */

// ============ SPECIFIC ROUTES FIRST ============

/**
 * @swagger
 * /api/bottles/fill-history:
 *   get:
 *     summary: Get bottle fill history
 *     tags: [Bottles]
 */
router.get('/fill-history', bottleController.getBottleFillHistory);

/**
 * @swagger
 * /api/bottles/in-center:
 *   get:
 *     summary: Get all bottles in center
 *     tags: [Bottles]
 */
router.get('/in-center', bottleController.getBottlesInCenter);

/**
 * @swagger
 * /api/bottles/filled:
 *   get:
 *     summary: Get all filled bottles ready for issue
 *     tags: [Bottles]
 */
router.get('/filled', bottleController.getFilledBottles);

/**
 * @swagger
 * /api/bottles/serial/{serial}:
 *   get:
 *     summary: Get bottle by serial numbers
 *     tags: [Bottles]
 */
router.get('/serial/:serial', bottleController.getBottleBySerial);

/**
 * @swagger
 * /api/bottles/receive:
 *   post:
 *     summary: Receive an empty bottle (returned or new)
 *     tags: [Bottles]
 */
router.post('/receive', bottleController.receiveBottle);

/**
 * @swagger
 * /api/bottles/receive-bulk:
 *   post:
 *     summary: Receive multiple empty bottles (batch)
 *     tags: [Bottles]
 */
router.post('/receive-bulk', bottleController.receiveBottlesBulk);

/**
 * @swagger
 * /api/bottles/fill:
 *   post:
 *     summary: Fill multiple bottles from main tank
 *     tags: [Bottles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bottleIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/fill', bottleController.fillBottles);

// ============ BOTTLE TYPES ROUTES ============

/**
 * @swagger
 * /api/bottles/types:
 *   get:
 *     summary: Get all bottle types
 *     tags: [Bottle Types]
 */
router.get('/types', bottleController.getAllBottleTypes);

/**
 * @swagger
 * /api/bottles/types:
 *   post:
 *     summary: Create a new bottle type
 *     tags: [Bottle Types]
 */
router.post('/types', bottleController.createBottleType);

/**
 * @swagger
 * /api/bottles/types/{id}:
 *   get:
 *     summary: Get bottle type by ID
 *     tags: [Bottle Types]
 */
router.get('/types/:id', bottleController.getBottleTypeById);

/**
 * @swagger
 * /api/bottles/types/{id}:
 *   put:
 *     summary: Update a bottle type
 *     tags: [Bottle Types]
 */
router.put('/types/:id', bottleController.updateBottleType);

/**
 * @swagger
 * /api/bottles/types/{id}:
 *   delete:
 *     summary: Delete a bottle type
 *     tags: [Bottle Types]
 */
router.delete('/types/:id', bottleController.deleteBottleType);

// ============ BOTTLE LEDGER ROUTES ============

/**
 * @swagger
 * /api/bottles/ledger:
 *   get:
 *     summary: Get all ledger entries
 *     tags: [Bottle Ledger]
 */
router.get('/ledger', bottleController.getAllLedgerEntries);

/**
 * @swagger
 * /api/bottles/ledger/summary:
 *   get:
 *     summary: Get ledger summary/statistics
 *     tags: [Bottle Ledger]
 */
router.get('/ledger/summary', bottleController.getLedgerSummary);

/**
 * @swagger
 * /api/bottles/ledger/customer/{customerId}:
 *   get:
 *     summary: Get customer's bottle ledger
 *     tags: [Bottle Ledger]
 */
router.get('/ledger/customer/:customerId', bottleController.getCustomerBottleLedger);

// ============ GENERAL BOTTLE ROUTES ============

/**
 * @swagger
 * /api/bottles:
 *   get:
 *     summary: Get all bottles
 *     tags: [Bottles]
 */
router.get('/', bottleController.getAllBottles);

/**
 * @swagger
 * /api/bottles:
 *   post:
 *     summary: Create a new bottle
 *     tags: [Bottles]
 */
router.post('/', bottleController.createBottle);

/**
 * @swagger
 * /api/bottles/{id}:
 *   get:
 *     summary: Get bottle by ID
 *     tags: [Bottles]
 */
router.get('/:id', bottleController.getBottleById);

/**
 * @swagger
 * /api/bottles/{id}:
 *   put:
 *     summary: Update a bottle
 *     tags: [Bottles]
 */
router.put('/:id', bottleController.updateBottle);

/**
 * @swagger
 * /api/bottles/{id}/ledger:
 *   get:
 *     summary: Get ledger entries for a specific bottle
 *     tags: [Bottle Ledger]
 */
router.get('/:id/ledger', bottleController.getBottleLedger);

module.exports = router;
