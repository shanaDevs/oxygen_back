const { MainTank, TankHistory, Supplier, SupplierTransaction, Notification, sequelize } = require('../models');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to create notification
const createNotification = async (type, title, message, priority, entityType, entityId, data, transaction) => {
    try {
        await Notification.create({
            id: generateId('notif'),
            type,
            title,
            message,
            priority,
            entityType,
            entityId,
            data
        }, { transaction });
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};

// Format tank for response
const formatTank = (tank) => ({
    id: tank.id,
    name: tank.name,
    // Primary fields (kg/tons)
    capacityTons: parseFloat(tank.capacityTons) || 10,
    currentLevelKg: parseFloat(tank.currentLevelKg) || 0,
    // Calculated fields
    capacityKg: (parseFloat(tank.capacityTons) || 10) * 1000,
    percentFull: tank.capacityTons > 0
        ? parseFloat(((parseFloat(tank.currentLevelKg) || 0) / ((parseFloat(tank.capacityTons) || 10) * 1000) * 100).toFixed(2))
        : 0,
    // Legacy fields
    capacityLiters: parseFloat(tank.capacityLiters) || 0,
    currentLevelLiters: parseFloat(tank.currentLevelLiters) || 0,
    // Other info
    lastRefillDate: tank.lastRefillDate,
    lastRefillAmountKg: parseFloat(tank.lastRefillAmountKg) || 0,
    lastRefillAmount: parseFloat(tank.lastRefillAmount) || 0,
    lowLevelAlertKg: parseFloat(tank.lowLevelAlertKg) || 500,
    criticalLevelAlertKg: parseFloat(tank.criticalLevelAlertKg) || 100
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
                capacityTons: 10,
                currentLevelKg: 0,
                capacityLiters: 20000,
                currentLevelLiters: 0,
                lowLevelAlertKg: 500,
                criticalLevelAlertKg: 100
            });
        }

        res.json({ success: true, data: formatTank(tank) });
    } catch (error) {
        console.error('Error fetching tank status:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update tank settings
exports.updateTankSettings = async (req, res) => {
    try {
        const { name, capacityTons, lowLevelAlertKg, criticalLevelAlertKg } = req.body;

        let tank = await MainTank.findOne();
        if (!tank) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tank not found' } });
        }

        await tank.update({
            name: name !== undefined ? name : tank.name,
            capacityTons: capacityTons !== undefined ? capacityTons : tank.capacityTons,
            lowLevelAlertKg: lowLevelAlertKg !== undefined ? lowLevelAlertKg : tank.lowLevelAlertKg,
            criticalLevelAlertKg: criticalLevelAlertKg !== undefined ? criticalLevelAlertKg : tank.criticalLevelAlertKg
        });

        res.json({ success: true, data: formatTank(tank), message: 'Tank settings updated successfully' });
    } catch (error) {
        console.error('Error updating tank settings:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update tank level (manual adjustment)
exports.updateTankLevel = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { currentLevelKg, notes } = req.body;

        if (currentLevelKg === undefined || currentLevelKg < 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Valid current level is required' }
            });
        }

        let tank = await MainTank.findOne({ transaction: t });
        if (!tank) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tank not found' } });
        }

        const capacityKg = (parseFloat(tank.capacityTons) || 10) * 1000;

        if (currentLevelKg > capacityKg) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: `Level cannot exceed tank capacity (${capacityKg}kg)` }
            });
        }

        const previousLevel = parseFloat(tank.currentLevelKg) || 0;
        const kgChanged = currentLevelKg - previousLevel;

        // Add history record
        await TankHistory.create({
            id: generateId('th'),
            mainTankId: tank.id,
            operationType: 'adjustment',
            kgBefore: previousLevel,
            kgChanged: Math.abs(kgChanged),
            kgAfter: currentLevelKg,
            notes: notes || `Manual adjustment from ${previousLevel}kg to ${currentLevelKg}kg`
        }, { transaction: t });

        await tank.update({
            currentLevelKg,
            currentLevelLiters: currentLevelKg * 5 // rough conversion
        }, { transaction: t });

        await t.commit();

        res.json({ success: true, data: formatTank(tank), message: 'Tank level updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating tank level:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Refill tank (purchase from supplier)
exports.refillTank = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { supplierId, kgSupplied, pricePerKg, amountPaid, paymentStatus, notes } = req.body;

        if (!supplierId || !kgSupplied || kgSupplied <= 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Supplier ID and kg supplied are required' }
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
                capacityTons: 10,
                currentLevelKg: 0
            }, { transaction: t });
        }

        const currentLevelKg = parseFloat(tank.currentLevelKg) || 0;
        const capacityKg = (parseFloat(tank.capacityTons) || 10) * 1000;
        const kg = parseFloat(kgSupplied);
        const newLevelKg = currentLevelKg + kg;

        if (newLevelKg > capacityKg) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: `Cannot add ${kg}kg. Max available space: ${(capacityKg - currentLevelKg).toFixed(2)}kg` }
            });
        }

        // Calculate amounts
        const price = parseFloat(pricePerKg) || 0;
        const totalAmount = kg * price;
        const paid = parseFloat(amountPaid) || 0;
        const outstanding = totalAmount - paid;

        // Create supplier transaction
        await SupplierTransaction.create({
            id: generateId('stx'),
            supplierId,
            supplierName: supplier.name,
            litersSupplied: kg, // Using this field for kg now
            pricePerLiter: price, // Using this field for price per kg
            totalAmount,
            amountPaid: paid,
            outstanding: outstanding > 0 ? outstanding : 0,
            paymentStatus: paymentStatus || (outstanding > 0 ? 'partial' : 'full'),
            notes: notes || `Tank refill: ${kg}kg at Rs.${price}/kg`
        }, { transaction: t });

        // Update supplier stats
        await supplier.update({
            totalSupplied: parseFloat(supplier.totalSupplied) + kg,
            totalPaid: parseFloat(supplier.totalPaid) + paid,
            totalOutstanding: parseFloat(supplier.totalOutstanding) + (outstanding > 0 ? outstanding : 0)
        }, { transaction: t });

        // Update main tank
        await tank.update({
            currentLevelKg: newLevelKg,
            currentLevelLiters: newLevelKg * 5, // rough conversion
            lastRefillDate: new Date(),
            lastRefillAmountKg: kg,
            lastRefillAmount: kg
        }, { transaction: t });

        // Add tank history
        await TankHistory.create({
            id: generateId('th'),
            mainTankId: tank.id,
            supplierId: supplierId,
            operationType: 'refill',
            kgBefore: currentLevelKg,
            kgChanged: kg,
            kgAfter: newLevelKg,
            totalAmount,
            amountPaid: paid,
            paymentStatus: paymentStatus || (outstanding > 0 ? 'partial' : 'full'),
            notes: `Refill ${kg}kg from ${supplier.name}`
        }, { transaction: t });

        // Create notification
        await createNotification(
            'refill_complete',
            'Tank Refilled',
            `Tank refilled with ${kg}kg from ${supplier.name}. New level: ${newLevelKg.toFixed(2)}kg`,
            'medium',
            'tank',
            tank.id,
            {
                kgAdded: kg,
                newLevel: newLevelKg,
                supplier: supplier.name,
                totalAmount,
                amountPaid: paid
            },
            t
        );

        await t.commit();

        const updatedTank = await MainTank.findByPk(tank.id);
        res.json({
            success: true,
            data: formatTank(updatedTank),
            message: `Tank refilled successfully with ${kg}kg. New level: ${newLevelKg.toFixed(2)}kg`
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
        const { limit = 50, operationType } = req.query;
        const where = {};

        if (operationType) {
            where.operationType = operationType;
        }

        const history = await TankHistory.findAll({
            where,
            include: [
                { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        const formattedHistory = history.map(h => ({
            id: h.id,
            mainTankId: h.mainTankId,
            supplierId: h.supplierId,
            supplierName: h.supplier?.name || null,
            operationType: h.operationType,
            kgBefore: parseFloat(h.kgBefore) || 0,
            kgChanged: parseFloat(h.kgChanged) || 0,
            kgAfter: parseFloat(h.kgAfter) || 0,
            litersBefore: parseFloat(h.litersBefore) || 0,
            litersChanged: parseFloat(h.litersChanged) || 0,
            litersAfter: parseFloat(h.litersAfter) || 0,
            bottlesFilled: h.bottlesFilled || 0,
            totalAmount: parseFloat(h.totalAmount) || 0,
            amountPaid: parseFloat(h.amountPaid) || 0,
            paymentStatus: h.paymentStatus,
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

        const formattedHistory = history.map(h => ({
            id: h.id,
            mainTankId: h.mainTankId,
            supplierId: h.supplierId,
            supplierName: h.supplier?.name || 'Unknown',
            supplierPhone: h.supplier?.phone || null,
            kgAdded: parseFloat(h.kgChanged) || 0,
            litersAdded: parseFloat(h.litersChanged) || 0,
            previousLevel: parseFloat(h.kgBefore) || 0,
            newLevel: parseFloat(h.kgAfter) || 0,
            totalAmount: parseFloat(h.totalAmount) || 0,
            amountPaid: parseFloat(h.amountPaid) || 0,
            outstanding: (parseFloat(h.totalAmount) || 0) - (parseFloat(h.amountPaid) || 0),
            paymentStatus: h.paymentStatus,
            notes: h.notes,
            filledAt: h.createdAt,
            createdAt: h.createdAt
        }));

        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching tank fill history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get tank usage history (bottle fills)
exports.getTankUsageHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const history = await TankHistory.findAll({
            where: {
                operationType: 'fill_bottles'
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        const formattedHistory = history.map(h => ({
            id: h.id,
            mainTankId: h.mainTankId,
            operationType: h.operationType,
            kgUsed: parseFloat(h.kgChanged) || 0,
            previousLevel: parseFloat(h.kgBefore) || 0,
            newLevel: parseFloat(h.kgAfter) || 0,
            bottlesFilled: h.bottlesFilled || 0,
            bottleIds: h.bottleIds || [],
            notes: h.notes,
            createdAt: h.createdAt
        }));

        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching tank usage history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get tank statistics
exports.getTankStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let tank = await MainTank.findOne();
        if (!tank) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tank not found' } });
        }

        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[sequelize.Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[sequelize.Op.lte] = new Date(endDate);
        }

        // Get refill stats
        const refillStats = await TankHistory.findAll({
            where: { ...where, operationType: 'refill' },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('kg_changed')), 'totalKgRefilled'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'refillCount'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalCost'],
                [sequelize.fn('SUM', sequelize.col('amount_paid')), 'totalPaid']
            ],
            raw: true
        });

        // Get usage stats
        const usageStats = await TankHistory.findAll({
            where: { ...where, operationType: 'fill_bottles' },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('kg_changed')), 'totalKgUsed'],
                [sequelize.fn('SUM', sequelize.col('bottles_filled')), 'totalBottlesFilled']
            ],
            raw: true
        });

        res.json({
            success: true,
            data: {
                tank: formatTank(tank),
                statistics: {
                    totalKgRefilled: parseFloat(refillStats[0]?.totalKgRefilled) || 0,
                    refillCount: parseInt(refillStats[0]?.refillCount) || 0,
                    totalCost: parseFloat(refillStats[0]?.totalCost) || 0,
                    totalPaid: parseFloat(refillStats[0]?.totalPaid) || 0,
                    totalOutstanding: (parseFloat(refillStats[0]?.totalCost) || 0) - (parseFloat(refillStats[0]?.totalPaid) || 0),
                    totalKgUsed: parseFloat(usageStats[0]?.totalKgUsed) || 0,
                    totalBottlesFilled: parseInt(usageStats[0]?.totalBottlesFilled) || 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching tank statistics:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
