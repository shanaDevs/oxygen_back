const express = require('express');
const router = express.Router();

// Import route files
router.use('/users', require('./users/userRouter'));
router.use('/bottles', require('./bottleRoutes'));
router.use('/bottle-types', require('./bottleTypeRoutes'));
router.use('/tank', require('./tankRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/sales', require('./salesRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/customer-transactions', require('./customerTransactionRoutes'));
router.use('/supplier-transactions', require('./supplierTransactionRoutes'));
router.use('/pdf', require('./pdfRoutes'));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API and database status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

module.exports = router;
