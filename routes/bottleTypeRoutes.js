const express = require('express');
const router = express.Router();
const bottleController = require('../controllers/bottleController');

/**
 * @swagger
 * components:
 *   schemas:
 *     BottleType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           description: Bottle type name (e.g., "Small 10L", "Large 50L")
 *         capacityLiters:
 *           type: number
 *           description: Capacity in liters
 *         pricePerFill:
 *           type: number
 *           description: Price to fill this bottle type
 *         depositAmount:
 *           type: number
 *           description: Deposit amount for this bottle type
 */

/**
 * @swagger
 * /api/bottle-types:
 *   get:
 *     summary: Get all bottle types
 *     tags: [Bottle Types]
 *     responses:
 *       200:
 *         description: List of bottle types
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
 *                     $ref: '#/components/schemas/BottleType'
 */
router.get('/', bottleController.getAllBottleTypes);

/**
 * @swagger
 * /api/bottle-types:
 *   post:
 *     summary: Create a new bottle type
 *     tags: [Bottle Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacityLiters
 *               - pricePerFill
 *             properties:
 *               name:
 *                 type: string
 *               capacityLiters:
 *                 type: number
 *               pricePerFill:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Bottle type created successfully
 */
router.post('/', bottleController.createBottleType);

/**
 * @swagger
 * /api/bottle-types/{id}:
 *   put:
 *     summary: Update bottle type
 *     tags: [Bottle Types]
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
 *               name:
 *                 type: string
 *               capacityLiters:
 *                 type: number
 *               pricePerFill:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bottle type updated successfully
 *       404:
 *         description: Bottle type not found
 */
router.put('/:id', bottleController.updateBottleType);

module.exports = router;
