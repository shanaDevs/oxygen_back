const { MainTank, TankHistory, Supplier, SupplierTransaction, sequelize } = require('../models');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format tank for response
const formatTank = (tank) => ({
    id: tank.id,
    name: tank.name,
    capacityLiters: parseFloat(tank.capacityLiters) || 0,
    currentLevelLiters: parseFloat(tank.currentLevelLiters) || 0,
    lastRefillDate: tank.lastRefillDate,
    lastRefillAmount: parseFloat(tank.lastRefillAmount) || 0
});

// Get tank status
exports.getTankStatus = async (req, res) => {
    try {
        let tank = await MainTank.findOne();
        
        if (!tank) {
            // Create default tank if not exists
            tank = await MainTank.create({
                id: 'tank-1',
                name: 'Main Oxygen Storage Tank',
                capacityLiters: 20000,
                currentLevelLiters: 0
            });
        }
        
        res.json({ success: true, data: formatTank(tank) });
    } catch (error) {
        console.error('Error fetching tank status:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update tank level
exports.updateTankLevel = async (req, res) => {
    try {
        const { currentLevelLiters } = req.body;
        
        if (currentLevelLiters === undefined || currentLevelLiters < 0) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Valid current level is required' } 
            });
        }
        
        let tank = await MainTank.findOne();
        if (!tank) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tank not found' } });
        }
        
        if (currentLevelLiters > parseFloat(tank.capacityLiters)) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Level cannot exceed tank capacity' } 
            });
        }
        
        await tank.update({ currentLevelLiters });
        
        res.json({ success: true, data: formatTank(tank), message: 'Tank level updated successfully' });
    } catch (error) {
        console.error('Error updating tank level:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Refill tank (creates supplier transaction)
exports.refillTank = async (req, res) => {
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
        
        // Get tank
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
        
        // Create supplier transaction
        await SupplierTransaction.create({
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
        
        const updatedTank = await MainTank.findByPk(tank.id);
        res.json({ 
            success: true, 
            data: formatTank(updatedTank), 
            message: `Tank refilled successfully. New level: ${newLevel}L` 
        });
    } catch (error) {
        await t.rollback();
        console.error('Error refilling tank:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get tank history
exports.getTankHistory = async (req, res) => {
    try {
        const history = await TankHistory.findAll({
            include: [
                { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        
        const formattedHistory = history.map(h => ({
            id: h.id,
            mainTankId: h.mainTankId,
            supplierId: h.supplierId,
            supplierName: h.supplier?.name || null,
            operationType: h.operationType,
            litersBefore: parseFloat(h.litersBefore) || 0,
            litersChanged: parseFloat(h.litersChanged) || 0,
            litersAfter: parseFloat(h.litersAfter) || 0,
            notes: h.notes,
            createdAt: h.createdAt
        }));
        
        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching tank history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get tank fill history (refills only - for frontend tank page)
exports.getTankFillHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const history = await TankHistory.findAll({
            where: {
                operationType: 'refill'
            },
            include: [
                { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        // Get related supplier transactions for payment info
        const formattedHistory = await Promise.all(history.map(async (h) => {
            // Try to find the supplier transaction for this refill
            let paymentInfo = {
                totalAmount: 0,
                amountPaid: 0,
                outstanding: 0,
                paymentStatus: 'unknown'
            };
            
            if (h.supplierId) {
                const supplierTransaction = await SupplierTransaction.findOne({
                    where: {
                        supplierId: h.supplierId,
                        litersSupplied: h.litersChanged
                    },
                    order: [['createdAt', 'DESC']]
                });
                
                if (supplierTransaction) {
                    paymentInfo = {
                        totalAmount: parseFloat(supplierTransaction.totalAmount) || 0,
                        amountPaid: parseFloat(supplierTransaction.amountPaid) || 0,
                        outstanding: parseFloat(supplierTransaction.outstanding) || 0,
                        paymentStatus: supplierTransaction.paymentStatus
                    };
                }
            }
            
            return {
                id: h.id,
                mainTankId: h.mainTankId,
                supplierId: h.supplierId,
                supplierName: h.supplier?.name || 'Unknown',
                supplierPhone: h.supplier?.phone || null,
                litersAdded: parseFloat(h.litersChanged) || 0,
                previousLevel: parseFloat(h.litersBefore) || 0,
                newLevel: parseFloat(h.litersAfter) || 0,
                ...paymentInfo,
                notes: h.notes,
                filledAt: h.createdAt,
                createdAt: h.createdAt
            };
        }));
        
        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching tank fill history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get tank fill history (refills only - for frontend tank page)
exports.getTankFillHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const history = await TankHistory.findAll({
            where: {
                operationType: 'refill'
            },
            include: [
                { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        // Get related supplier transactions for payment info
        const formattedHistory = await Promise.all(history.map(async (h) => {
            // Try to find the supplier transaction for this refill
            let paymentInfo = {
                totalAmount: 0,
                amountPaid: 0,
                outstanding: 0,
                paymentStatus: 'unknown'
            };
            
            if (h.supplierId) {
                const supplierTransaction = await SupplierTransaction.findOne({
                    where: {
                        supplierId: h.supplierId,
                        litersSupplied: h.litersChanged
                    },
                    order: [['createdAt', 'DESC']]
                });
                
                if (supplierTransaction) {
                    paymentInfo = {
                        totalAmount: parseFloat(supplierTransaction.totalAmount) || 0,
                        amountPaid: parseFloat(supplierTransaction.amountPaid) || 0,
                        outstanding: parseFloat(supplierTransaction.outstanding) || 0,
                        paymentStatus: supplierTransaction.paymentStatus
                    };
                }
            }
            
            return {
                id: h.id,
                mainTankId: h.mainTankId,
                supplierId: h.supplierId,
                supplierName: h.supplier?.name || 'Unknown',
                supplierPhone: h.supplier?.phone || null,
                litersAdded: parseFloat(h.litersChanged) || 0,
                previousLevel: parseFloat(h.litersBefore) || 0,
                newLevel: parseFloat(h.litersAfter) || 0,
                ...paymentInfo,
                notes: h.notes,
                filledAt: h.createdAt,
                createdAt: h.createdAt
            };
        }));
        
        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching tank fill history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
