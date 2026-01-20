const { SupplierTransaction, Supplier, MainTank, TankHistory, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format transaction for response
const formatTransaction = (tx) => ({
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

// Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const { supplierId } = req.query;
        const where = {};
        
        if (supplierId) {
            where.supplierId = supplierId;
        }
        
        const transactions = await SupplierTransaction.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 100
        });
        
        res.json({ success: true, data: transactions.map(formatTransaction) });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create supplier transaction (delivery)
exports.createTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { supplierId, litersSupplied, pricePerLiter, amountPaid, paymentStatus, notes } = req.body;
        
        if (!supplierId || !litersSupplied || litersSupplied <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Supplier ID and liters supplied are required' } 
            });
        }
        
        // Get supplier
        const supplier = await Supplier.findByPk(supplierId, { transaction: t });
        if (!supplier) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
        }
        
        // Get or create main tank
        let tank = await MainTank.findOne({ transaction: t });
        if (!tank) {
            tank = await MainTank.create({
                id: 'tank-1',
                name: 'Main Oxygen Storage Tank',
                capacityLiters: 20000,
                currentLevelLiters: 0
            }, { transaction: t });
        }
        
        const currentLevel = parseFloat(tank.currentLevelLiters) || 0;
        const capacity = parseFloat(tank.capacityLiters) || 20000;
        const liters = parseFloat(litersSupplied);
        const newLevel = currentLevel + liters;
        
        // Check if tank can hold the new supply
        if (newLevel > capacity) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: `Cannot add ${liters}L. Max available space: ${capacity - currentLevel}L` } 
            });
        }
        
        // Calculate amounts
        const price = parseFloat(pricePerLiter) || 0;
        const totalAmount = liters * price;
        const paid = parseFloat(amountPaid) || 0;
        const outstanding = totalAmount - paid;
        
        // Create transaction record
        const transaction = await SupplierTransaction.create({
            id: generateId('stx'),
            supplierId,
            supplierName: supplier.name,
            litersSupplied: liters,
            pricePerLiter: price,
            totalAmount,
            amountPaid: paid,
            outstanding: outstanding > 0 ? outstanding : 0,
            paymentStatus: paymentStatus || (outstanding > 0 ? 'partial' : 'full'),
            notes: notes || null
        }, { transaction: t });
        
        // Update supplier stats
        await supplier.update({
            totalSupplied: parseFloat(supplier.totalSupplied) + liters,
            totalPaid: parseFloat(supplier.totalPaid) + paid,
            totalOutstanding: parseFloat(supplier.totalOutstanding) + (outstanding > 0 ? outstanding : 0)
        }, { transaction: t });
        
        // Update main tank
        await tank.update({
            currentLevelLiters: newLevel,
            lastRefillDate: new Date(),
            lastRefillAmount: liters
        }, { transaction: t });
        
        // Add tank history
        await TankHistory.create({
            id: generateId('th'),
            mainTankId: tank.id,
            supplierId: supplierId,
            operationType: 'refill',
            litersBefore: currentLevel,
            litersChanged: liters,
            litersAfter: newLevel,
            notes: `Refill from ${supplier.name}`
        }, { transaction: t });
        
        await t.commit();
        
        res.status(201).json({ 
            success: true, 
            data: formatTransaction(transaction), 
            message: `${liters}L supplied by ${supplier.name}. Tank level: ${newLevel}L` 
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating transaction:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Make payment to supplier
exports.makePayment = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { supplierId, amount, notes } = req.body;
        
        if (!supplierId || !amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Supplier ID and valid amount are required' } 
            });
        }
        
        // Get supplier
        const supplier = await Supplier.findByPk(supplierId, { transaction: t });
        if (!supplier) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
        }
        
        const currentOutstanding = parseFloat(supplier.totalOutstanding) || 0;
        const paymentAmount = parseFloat(amount);
        const newOutstanding = Math.max(0, currentOutstanding - paymentAmount);
        
        // Update supplier
        await supplier.update({
            totalPaid: parseFloat(supplier.totalPaid) + paymentAmount,
            totalOutstanding: newOutstanding
        }, { transaction: t });
        
        await t.commit();
        
        res.json({ 
            success: true, 
            message: `Payment of Rs. ${paymentAmount} made to ${supplier.name}. Remaining outstanding: Rs. ${newOutstanding}` 
        });
    } catch (error) {
        await t.rollback();
        console.error('Error making payment:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
