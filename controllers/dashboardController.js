const { MainTank, Bottle, Customer, Supplier, CustomerTransaction, SupplierTransaction, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Get main tank info
        let tank = await MainTank.findOne();
        if (!tank) {
            tank = { currentLevelLiters: 0, capacityLiters: 20000 };
        }
        
        // Get bottle counts by status
        const bottleCounts = await Bottle.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true
        });
        
        const bottleStats = {
            filled: 0,
            empty: 0,
            with_customer: 0
        };
        bottleCounts.forEach(row => {
            bottleStats[row.status] = parseInt(row.count) || 0;
        });
        
        // Get today's transactions count (issues)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayRefills = await CustomerTransaction.count({
            where: {
                transactionType: 'issue',
                createdAt: { [Op.gte]: today }
            }
        });
        
        // Get total outstanding from customers
        const customerOutstanding = await Customer.sum('totalCredit', {
            where: { totalCredit: { [Op.gt]: 0 } }
        }) || 0;
        
        // Get total outstanding to suppliers
        const supplierOutstanding = await Supplier.sum('totalOutstanding', {
            where: { totalOutstanding: { [Op.gt]: 0 } }
        }) || 0;
        
        // Get recent supplier transactions
        const recentSupplierTx = await SupplierTransaction.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        
        // Get recent customer transactions
        const recentCustomerTx = await CustomerTransaction.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        
        // Format transactions
        const formatSupplierTx = (tx) => ({
            id: tx.id,
            supplierId: tx.supplierId,
            supplierName: tx.supplierName,
            litersSupplied: parseFloat(tx.litersSupplied) || 0,
            pricePerLiter: parseFloat(tx.pricePerLiter) || 0,
            totalAmount: parseFloat(tx.totalAmount) || 0,
            amountPaid: parseFloat(tx.amountPaid) || 0,
            outstanding: parseFloat(tx.outstanding) || 0,
            paymentStatus: tx.paymentStatus,
            notes: tx.notes,
            createdAt: tx.createdAt
        });
        
        const formatCustomerTx = (tx) => ({
            id: tx.id,
            customerId: tx.customerId,
            customerName: tx.customerName,
            transactionType: tx.transactionType,
            bottleIds: tx.bottleIds || [],
            bottleCount: tx.bottleCount || 0,
            bottleType: tx.bottleType,
            totalAmount: parseFloat(tx.totalAmount) || 0,
            amountPaid: parseFloat(tx.amountPaid) || 0,
            creditAmount: parseFloat(tx.creditAmount) || 0,
            paymentStatus: tx.paymentStatus,
            notes: tx.notes,
            createdAt: tx.createdAt
        });
        
        const stats = {
            mainTankLevel: parseFloat(tank.currentLevelLiters) || 0,
            mainTankCapacity: parseFloat(tank.capacityLiters) || 20000,
            filledBottles: bottleStats.filled,
            emptyBottles: bottleStats.empty,
            bottlesWithCustomers: bottleStats.with_customer,
            todayRefills,
            totalOutstandingFromCustomers: parseFloat(customerOutstanding) || 0,
            totalOutstandingToSuppliers: parseFloat(supplierOutstanding) || 0,
            recentSupplierTransactions: recentSupplierTx.map(formatSupplierTx),
            recentCustomerTransactions: recentCustomerTx.map(formatCustomerTx)
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
