const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         discount:
 *           type: number
 *         total:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, mobile]
 *         status:
 *           type: string
 *           enum: [completed, pending, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending, cancelled]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, card, mobile]
 *     responses:
 *       200:
 *         description: List of sales
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
 *                     $ref: '#/components/schemas/Sale'
 */
router.get('/', salesController.getAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details
 *       404:
 *         description: Sale not found
 */
router.get('/:id', salesController.getSaleById);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - total
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               subtotal:
 *                 type: number
 *               tax:
 *                 type: number
 *               discount:
 *                 type: number
 *               total:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, mobile]
 *                 default: cash
 *     responses:
 *       201:
 *         description: Sale created successfully
 */
router.post('/', salesController.createSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Update sale
 *     tags: [Sales]
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
 *               status:
 *                 type: string
 *                 enum: [completed, pending, cancelled]
 *     responses:
 *       200:
 *         description: Sale updated successfully
 *       404:
 *         description: Sale not found
 */
router.put('/:id', salesController.updateSale);

module.exports = router;
