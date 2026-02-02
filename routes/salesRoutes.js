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
 *         invoiceNumber:
 *           type: string
 *         customerId:
 *           type: string
 *         customerName:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               bottleId:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               capacityLiters:
 *                 type: number
 *               price:
 *                 type: number
 *         bottleCount:
 *           type: integer
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
 *           enum: [cash, credit, partial, bank_transfer]
 *         amountPaid:
 *           type: number
 *         creditAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled, refunded]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, partial, full]
 */

/**
 * @swagger
 * /api/sales/statistics:
 *   get:
 *     summary: Get sales statistics
 *     tags: [Sales]
 */
router.get('/statistics', salesController.getSalesStatistics);

/**
 * @swagger
 * /api/sales/outstanding:
 *   get:
 *     summary: Get all outstanding sales
 *     tags: [Sales]
 */
router.get('/outstanding', salesController.getAllOutstanding);

/**
 * @swagger
 * /api/sales/outstanding/customer/{customerId}:
 *   get:
 *     summary: Get customer's outstanding sales
 *     tags: [Sales]
 */
router.get('/outstanding/customer/:customerId', salesController.getCustomerOutstanding);

/**
 * @swagger
 * /api/sales/invoice/{invoiceNumber}:
 *   get:
 *     summary: Get sale by invoice number
 *     tags: [Sales]
 */
router.get('/invoice/:invoiceNumber', salesController.getSaleByInvoice);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 */
router.get('/', salesController.getAllSales);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale (POS transaction)
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - bottleIds
 *             properties:
 *               customerId:
 *                 type: string
 *               bottleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               taxPercentage:
 *                 type: number
 *               discountPercentage:
 *                 type: number
 *               discount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, credit, partial]
 *               amountPaid:
 *                 type: number
 *               notes:
 *                 type: string
 */
router.post('/', salesController.createSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
 */
router.get('/:id', salesController.getSaleById);

/**
 * @swagger
 * /api/sales/{saleId}/payment:
 *   post:
 *     summary: Add payment to existing sale (for outstanding)
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank_transfer, cheque, other]
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post('/:saleId/payment', salesController.addPayment);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   post:
 *     summary: Cancel a sale
 *     tags: [Sales]
 */
router.post('/:id/cancel', salesController.cancelSale);

module.exports = router;
