const express = require('express');
const router = express.Router();
const supplierTransactionController = require('../controllers/supplierTransactionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         supplierId:
 *           type: string
 *         supplierName:
 *           type: string
 *         litersSupplied:
 *           type: number
 *           description: Liters of oxygen delivered
 *         pricePerLiter:
 *           type: number
 *         totalAmount:
 *           type: number
 *         amountPaid:
 *           type: number
 *         outstanding:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [full, partial, outstanding]
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/supplier-transactions:
 *   get:
 *     summary: Get all supplier transactions
 *     tags: [Supplier Transactions]
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *     responses:
 *       200:
 *         description: List of supplier transactions
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
 *                     $ref: '#/components/schemas/SupplierTransaction'
 */
router.get('/', supplierTransactionController.getAllTransactions);

/**
 * @swagger
 * /api/supplier-transactions:
 *   post:
 *     summary: Create supplier delivery transaction (use /api/tank/refill for tank refill)
 *     tags: [Supplier Transactions]
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
 *               litersSupplied:
 *                 type: number
 *               pricePerLiter:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *                 default: 0
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', supplierTransactionController.createTransaction);

/**
 * @swagger
 * /api/supplier-transactions/payment:
 *   post:
 *     summary: Make payment to supplier for outstanding balance
 *     tags: [Supplier Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - amount
 *             properties:
 *               supplierId:
 *                 type: string
 *                 description: Supplier ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded, supplier outstanding reduced
 *       400:
 *         description: Invalid payment amount or no outstanding balance
 */
router.post('/payment', supplierTransactionController.makePayment);

module.exports = router;
