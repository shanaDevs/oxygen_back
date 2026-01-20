const express = require('express');
const router = express.Router();
const customerTransactionController = require('../controllers/customerTransactionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         customerName:
 *           type: string
 *         transactionType:
 *           type: string
 *           enum: [issue, return, refill, payment]
 *         bottleIds:
 *           type: array
 *           items:
 *             type: string
 *         bottleCount:
 *           type: integer
 *         bottleType:
 *           type: string
 *         totalAmount:
 *           type: number
 *         amountPaid:
 *           type: number
 *         creditAmount:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [full, partial, credit]
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/customer-transactions:
 *   get:
 *     summary: Get all customer transactions
 *     tags: [Customer Transactions]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [issue, return, refill, payment]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: List of customer transactions
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
 *                     $ref: '#/components/schemas/CustomerTransaction'
 */
router.get('/', customerTransactionController.getAllTransactions);

/**
 * @swagger
 * /api/customer-transactions/issue:
 *   post:
 *     summary: Issue filled bottles to customer
 *     tags: [Customer Transactions]
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
 *                 description: Customer ID
 *               bottleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of filled bottle IDs to issue
 *               amountPaid:
 *                 type: number
 *                 description: Amount paid by customer (default 0)
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bottles issued successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/CustomerTransaction'
 *                     customer:
 *                       type: object
 *       400:
 *         description: Bottles not available or not filled
 */
router.post('/issue', customerTransactionController.issueBottles);

/**
 * @swagger
 * /api/customer-transactions/return:
 *   post:
 *     summary: Return bottles from customer
 *     tags: [Customer Transactions]
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
 *                 description: Customer ID
 *               bottleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of bottle IDs being returned
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bottles returned successfully (status set to empty)
 *       400:
 *         description: Bottles not with this customer
 */
router.post('/return', customerTransactionController.returnBottles);

/**
 * @swagger
 * /api/customer-transactions/payment:
 *   post:
 *     summary: Collect payment from customer
 *     tags: [Customer Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment collected, customer credit reduced
 *       400:
 *         description: Invalid payment amount
 */
router.post('/payment', customerTransactionController.collectPayment);

module.exports = router;
