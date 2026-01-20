const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { seedDefaultRoles } = require('./seeders/defaultRoles');
const { seedDefaultSuperAdmin } = require('./seeders/defaultUser');
const { seedDummyData } = require('./seeders/dummyData');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Oxygen Refilling Center POS API',
            version: '1.0.0',
            description: 'Complete Backend API for Oxygen Refilling Center POS System. This system manages oxygen tank refilling from suppliers, bottle management, customer transactions, and payment tracking.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: 'Development server',
            },
        ],
        tags: [
            { name: 'Health', description: 'API health check endpoints' },
            { name: 'Dashboard', description: 'Dashboard statistics and overview' },
            { name: 'Tank', description: 'Main oxygen tank management - level, refills, history' },
            { name: 'Bottles', description: 'Oxygen bottle management - create, fill, track' },
            { name: 'Bottle Types', description: 'Bottle type configuration - sizes and pricing' },
            { name: 'Bottle Ledger', description: 'Complete bottle process history and audit trail' },
            { name: 'Customers', description: 'Customer management - CRUD operations' },
            { name: 'Customer Transactions', description: 'Issue/return bottles, collect payments' },
            { name: 'Suppliers', description: 'Supplier management - CRUD operations' },
            { name: 'Supplier Transactions', description: 'Supplier deliveries and payments' },
            { name: 'Products', description: 'Additional product management' },
            { name: 'Categories', description: 'Product category management' },
            { name: 'Sales', description: 'General sales management' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js', './routes/**/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Oxygen Refilling Center POS API Documentation'
}));

// Routes
/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'Oxygen Refilling Center POS API is running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Oxygen Refilling Center API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes - User Management
app.use('/api/users', require('./routes/users/userRouter'));

// API Routes - Oxygen Refilling Center
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/customer-transactions', require('./routes/customerTransactionRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/supplier-transactions', require('./routes/supplierTransactionRoutes'));
app.use('/api/bottles', require('./routes/bottleRoutes'));
app.use('/api/bottle-types', require('./routes/bottleTypeRoutes'));
app.use('/api/tank', require('./routes/tankRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: { 
            code: 'NOT_FOUND', 
            message: `Route ${req.method} ${req.path} not found` 
        } 
    });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Sync database (set to false in production)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized.');
            
            // Seed default roles first
            await seedDefaultRoles();
            
            // Then seed default super admin user
            await seedDefaultSuperAdmin();
            
            // Seed dummy data for oxygen refilling center
            await seedDummyData();
        }

        app.listen(PORT, () => {
            console.log('');
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('║                                                           ║');
            console.log('║   🏭 Oxygen Refilling Center POS API                      ║');
            console.log('║                                                           ║');
            console.log('╚═══════════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`🚀 Server running on port: ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
            console.log('');
            console.log('Available Endpoints:');
            console.log('  • /api/dashboard/stats  - Dashboard statistics');
            console.log('  • /api/customers        - Customer management');
            console.log('  • /api/suppliers        - Supplier management');
            console.log('  • /api/bottles          - Bottle management');
            console.log('  • /api/tank             - Tank management');
            console.log('  • /api/sales            - Sales management');
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

