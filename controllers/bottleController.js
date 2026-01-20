const { Bottle, BottleType, MainTank, TankHistory, BottleLedger, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format bottle for response
const formatBottle = (bottle) => ({
    id: bottle.id,
    serialNumber: bottle.serialNumber,
    capacityLiters: parseFloat(bottle.capacityLiters) || 0,
    status: bottle.status,
    customerId: bottle.customerId,
    customerName: bottle.customerName,
    filledDate: bottle.filledDate,
    issuedDate: bottle.issuedDate
});

// Format bottle type for response
const formatBottleType = (type) => ({
    id: type.id,
    name: type.name,
    capacityLiters: parseFloat(type.capacityLiters) || 0,
    pricePerFill: parseFloat(type.pricePerFill) || 0,
    depositAmount: parseFloat(type.depositAmount) || 0
});

// Get all bottles
exports.getAllBottles = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        
        if (status) {
            where.status = status;
        }
        
        const bottles = await Bottle.findAll({
            where,
            order: [['serialNumber', 'ASC']]
        });
        
        res.json({ success: true, data: bottles.map(formatBottle) });
    } catch (error) {
        console.error('Error fetching bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single bottle
exports.getBottleById = async (req, res) => {
    try {
        const bottle = await Bottle.findByPk(req.params.id);
        
        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }
        
        res.json({ success: true, data: formatBottle(bottle) });
    } catch (error) {
        console.error('Error fetching bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create bottle
exports.createBottle = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { serialNumber, capacityLiters, bottleTypeId } = req.body;
        
        if (!serialNumber || !capacityLiters) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Serial number and capacity are required' } 
            });
        }
        
        // Check for duplicate serial number
        const existing = await Bottle.findOne({ where: { serialNumber } });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Serial number already exists' } 
            });
        }
        
        const bottle = await Bottle.create({
            id: generateId('bot'),
            serialNumber,
            capacityLiters,
            bottleTypeId: bottleTypeId || null,
            status: 'empty'
        }, { transaction: t });
        
        // Log to ledger
        await BottleLedger.create({
            id: generateId('bl'),
            bottleId: bottle.id,
            serialNumber: bottle.serialNumber,
            operationType: 'created',
            previousStatus: null,
            newStatus: 'empty',
            notes: `New bottle created with capacity ${capacityLiters}L`
        }, { transaction: t });
        
        await t.commit();
        
        res.status(201).json({ success: true, data: formatBottle(bottle), message: 'Bottle created successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error creating bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update bottle
exports.updateBottle = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const bottle = await Bottle.findByPk(req.params.id, { transaction: t });
        
        if (!bottle) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }
        
        const previousStatus = bottle.status;
        const { serialNumber, capacityLiters, status, customerId, customerName } = req.body;
        
        await bottle.update({
            serialNumber: serialNumber !== undefined ? serialNumber : bottle.serialNumber,
            capacityLiters: capacityLiters !== undefined ? capacityLiters : bottle.capacityLiters,
            status: status !== undefined ? status : bottle.status,
            customerId: customerId !== undefined ? customerId : bottle.customerId,
            customerName: customerName !== undefined ? customerName : bottle.customerName
        }, { transaction: t });
        
        // Log to ledger
        const changes = [];
        if (serialNumber !== undefined && serialNumber !== bottle.serialNumber) changes.push(`serial: ${serialNumber}`);
        if (capacityLiters !== undefined) changes.push(`capacity: ${capacityLiters}L`);
        if (status !== undefined && status !== previousStatus) changes.push(`status: ${previousStatus} → ${status}`);
        
        await BottleLedger.create({
            id: generateId('bl'),
            bottleId: bottle.id,
            serialNumber: bottle.serialNumber,
            operationType: 'updated',
            previousStatus: previousStatus,
            newStatus: status || previousStatus,
            customerId: customerId || bottle.customerId,
            customerName: customerName || bottle.customerName,
            notes: changes.length > 0 ? `Updated: ${changes.join(', ')}` : 'Bottle details updated'
        }, { transaction: t });
        
        await t.commit();
        
        res.json({ success: true, data: formatBottle(bottle), message: 'Bottle updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Fill multiple bottles from main tank
exports.fillBottles = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { bottleIds } = req.body;
        
        if (!bottleIds || !Array.isArray(bottleIds) || bottleIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Bottle IDs are required' } 
            });
        }
        
        // Get bottles
        const bottles = await Bottle.findAll({
            where: { 
                id: { [Op.in]: bottleIds },
                status: 'empty'
            },
            transaction: t
        });
        
        if (bottles.length !== bottleIds.length) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Some bottles are not empty or not found' } 
            });
        }
        
        // Calculate total liters needed
        const totalLiters = bottles.reduce((sum, b) => sum + parseFloat(b.capacityLiters), 0);
        
        // Get main tank
        let tank = await MainTank.findOne({ transaction: t });
        if (!tank) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Main tank not configured' } 
            });
        }
        
        const currentLevel = parseFloat(tank.currentLevelLiters) || 0;
        
        if (currentLevel < totalLiters) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: `Insufficient oxygen in main tank. Available: ${currentLevel}L, Required: ${totalLiters}L` } 
            });
        }
        
        // Update bottles to filled status
        await Bottle.update(
            { status: 'filled', filledDate: new Date() },
            { where: { id: { [Op.in]: bottleIds } }, transaction: t }
        );
        
        // Update main tank
        const newLevel = currentLevel - totalLiters;
        await tank.update({ currentLevelLiters: newLevel }, { transaction: t });
        
        // Add tank history
        const tankHistoryRecord = await TankHistory.create({
            id: generateId('th'),
            mainTankId: tank.id,
            supplierId: null,
            operationType: 'fill_bottles',
            litersBefore: currentLevel,
            litersChanged: totalLiters,
            litersAfter: newLevel,
            notes: `Filled ${bottles.length} bottles`
        }, { transaction: t });
        
        // Log each bottle to ledger
        for (const bottle of bottles) {
            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'filled',
                previousStatus: 'empty',
                newStatus: 'filled',
                tankHistoryId: tankHistoryRecord.id,
                litersUsed: parseFloat(bottle.capacityLiters),
                notes: `Filled from main tank (${currentLevel}L → ${newLevel}L)`
            }, { transaction: t });
        }
        
        await t.commit();
        
        // Get updated bottles
        const updatedBottles = await Bottle.findAll({
            where: { id: { [Op.in]: bottleIds } }
        });
        
        res.json({ 
            success: true, 
            data: updatedBottles.map(formatBottle), 
            message: `${bottles.length} bottles filled successfully. Tank level: ${newLevel}L` 
        });
    } catch (error) {
        await t.rollback();
        console.error('Error filling bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// === Bottle Types ===

// Get all bottle types
exports.getAllBottleTypes = async (req, res) => {
    try {
        const types = await BottleType.findAll({
            order: [['capacityLiters', 'ASC']]
        });
        res.json({ success: true, data: types.map(formatBottleType) });
    } catch (error) {
        console.error('Error fetching bottle types:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create bottle type
exports.createBottleType = async (req, res) => {
    try {
        const { name, capacityLiters, pricePerFill, depositAmount } = req.body;
        
        if (!name || !capacityLiters || !pricePerFill) {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'VALIDATION_ERROR', message: 'Name, capacity, and price per fill are required' } 
            });
        }
        
        const type = await BottleType.create({
            id: generateId('type'),
            name,
            capacityLiters,
            pricePerFill,
            depositAmount: depositAmount || 0
        });
        
        res.status(201).json({ success: true, data: formatBottleType(type), message: 'Bottle type created successfully' });
    } catch (error) {
        console.error('Error creating bottle type:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Update bottle type
exports.updateBottleType = async (req, res) => {
    try {
        const type = await BottleType.findByPk(req.params.id);
        
        if (!type) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle type not found' } });
        }
        
        const { name, capacityLiters, pricePerFill, depositAmount } = req.body;
        
        await type.update({
            name: name !== undefined ? name : type.name,
            capacityLiters: capacityLiters !== undefined ? capacityLiters : type.capacityLiters,
            pricePerFill: pricePerFill !== undefined ? pricePerFill : type.pricePerFill,
            depositAmount: depositAmount !== undefined ? depositAmount : type.depositAmount
        });
        
        res.json({ success: true, data: formatBottleType(type), message: 'Bottle type updated successfully' });
    } catch (error) {
        console.error('Error updating bottle type:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// === Bottle Ledger ===

// Format ledger entry for response
const formatLedgerEntry = (entry) => ({
    id: entry.id,
    bottleId: entry.bottleId,
    serialNumber: entry.serialNumber,
    operationType: entry.operationType,
    previousStatus: entry.previousStatus,
    newStatus: entry.newStatus,
    customerId: entry.customerId,
    customerName: entry.customerName,
    transactionId: entry.transactionId,
    tankHistoryId: entry.tankHistoryId,
    litersUsed: parseFloat(entry.litersUsed) || 0,
    amount: parseFloat(entry.amount) || 0,
    notes: entry.notes,
    performedBy: entry.performedBy,
    createdAt: entry.createdAt
});

// Get all ledger entries
exports.getAllLedgerEntries = async (req, res) => {
    try {
        const { bottleId, customerId, operationType, startDate, endDate, limit = 100 } = req.query;
        const where = {};
        
        if (bottleId) where.bottleId = bottleId;
        if (customerId) where.customerId = customerId;
        if (operationType) where.operationType = operationType;
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }
        
        const entries = await BottleLedger.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        res.json({ success: true, data: entries.map(formatLedgerEntry) });
    } catch (error) {
        console.error('Error fetching ledger entries:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get ledger entries for a specific bottle
exports.getBottleLedger = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bottle = await Bottle.findByPk(id);
        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }
        
        const entries = await BottleLedger.findAll({
            where: { bottleId: id },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ 
            success: true, 
            data: {
                bottle: formatBottle(bottle),
                ledger: entries.map(formatLedgerEntry)
            }
        });
    } catch (error) {
        console.error('Error fetching bottle ledger:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get ledger summary/statistics
exports.getLedgerSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }
        
        // Get counts by operation type
        const operationCounts = await BottleLedger.findAll({
            where,
            attributes: [
                'operationType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['operationType'],
            raw: true
        });
        
        // Get total liters used
        const totalLiters = await BottleLedger.sum('litersUsed', { where }) || 0;
        
        // Get total amount
        const totalAmount = await BottleLedger.sum('amount', { where }) || 0;
        
        // Get recent entries
        const recentEntries = await BottleLedger.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        res.json({
            success: true,
            data: {
                operationCounts: operationCounts.reduce((acc, curr) => {
                    acc[curr.operationType] = parseInt(curr.count);
                    return acc;
                }, {}),
                totalLitersUsed: parseFloat(totalLiters),
                totalAmount: parseFloat(totalAmount),
                recentEntries: recentEntries.map(formatLedgerEntry)
            }
        });
    } catch (error) {
        console.error('Error fetching ledger summary:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get bottle fill history (for frontend bottles page)
exports.getBottleFillHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        // Get fill operations from BottleLedger
        const fillHistory = await BottleLedger.findAll({
            where: {
                operationType: 'filled'
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });
        
        const formattedHistory = fillHistory.map(entry => ({
            id: entry.id,
            bottleId: entry.bottleId,
            serialNumber: entry.serialNumber,
            capacityLiters: parseFloat(entry.litersUsed) || 0,
            litersUsed: parseFloat(entry.litersUsed) || 0,
            tankHistoryId: entry.tankHistoryId,
            notes: entry.notes,
            filledAt: entry.createdAt,
            createdAt: entry.createdAt
        }));
        
        res.json({ success: true, data: formattedHistory });
    } catch (error) {
        console.error('Error fetching bottle fill history:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
