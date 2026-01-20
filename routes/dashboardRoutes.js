const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get comprehensive dashboard statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     mainTankLevel:
 *                       type: number
 *                       description: Current tank level in liters
 *                     mainTankCapacity:
 *                       type: number
 *                       description: Tank capacity in liters
 *                     filledBottles:
 *                       type: integer
 *                       description: Number of filled bottles in stock
 *                     emptyBottles:
 *                       type: integer
 *                       description: Number of empty bottles
 *                     bottlesWithCustomers:
 *                       type: integer
 *                       description: Number of bottles currently with customers
 *                     todayRefills:
 *                       type: integer
 *                       description: Number of bottle refills today
 *                     totalOutstandingFromCustomers:
 *                       type: number
 *                       description: Total credit outstanding from customers
 *                     totalOutstandingToSuppliers:
 *                       type: number
 *                       description: Total amount owed to suppliers
 *                     recentSupplierTransactions:
 *                       type: array
 *                       description: Last 5 supplier transactions
 *                     recentCustomerTransactions:
 *                       type: array
 *                       description: Last 5 customer transactions
 */
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
