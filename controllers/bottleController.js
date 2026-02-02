const { Bottle, BottleType, MainTank, TankHistory, BottleLedger, Customer, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

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

// Format bottle for response
const formatBottle = (bottle) => ({
    id: bottle.id,
    serialNumber: bottle.serialNumber,
    capacityLiters: parseFloat(bottle.capacityLiters) || 0,
    bottleTypeId: bottle.bottleTypeId,
    status: bottle.status,
    location: bottle.location,
    customerId: bottle.customerId,
    customerName: bottle.customerName,
    ownerId: bottle.ownerId,
    ownerName: bottle.ownerName,
    filledDate: bottle.filledDate,
    issuedDate: bottle.issuedDate,
    receivedDate: bottle.receivedDate,
    lastReturnedDate: bottle.lastReturnedDate,
    fillCount: bottle.fillCount || 0,
    issueCount: bottle.issueCount || 0,
    notes: bottle.notes,
    bottleType: bottle.bottleType ? formatBottleType(bottle.bottleType) : null
});

// Format bottle type for response
const formatBottleType = (type) => ({
    id: type.id,
    name: type.name,
    capacityLiters: parseFloat(type.capacityLiters) || 0,
    refillKg: parseFloat(type.refillKg) || 0,
    pricePerFill: parseFloat(type.pricePerFill) || 0,
    depositAmount: parseFloat(type.depositAmount) || 0,
    description: type.description,
    isActive: type.isActive
});

// Get all bottles
exports.getAllBottles = async (req, res) => {
    try {
        const { status, location, customerId } = req.query;
        const where = {};

        if (status) where.status = status;
        if (location) where.location = location;
        if (customerId) where.customerId = customerId;

        const bottles = await Bottle.findAll({
            where,
            include: [{ model: BottleType, as: 'bottleType' }],
            order: [['serialNumber', 'ASC']]
        });

        res.json({ success: true, data: bottles.map(formatBottle) });
    } catch (error) {
        console.error('Error fetching bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get bottles in center (available for issue)
exports.getBottlesInCenter = async (req, res) => {
    try {
        const { status } = req.query;
        const where = { location: 'center' };

        if (status) where.status = status;

        const bottles = await Bottle.findAll({
            where,
            include: [{ model: BottleType, as: 'bottleType' }],
            order: [['status', 'DESC'], ['serialNumber', 'ASC']]
        });

        res.json({ success: true, data: bottles.map(formatBottle) });
    } catch (error) {
        console.error('Error fetching center bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get filled bottles ready for issue
exports.getFilledBottles = async (req, res) => {
    try {
        const bottles = await Bottle.findAll({
            where: {
                status: 'filled',
                location: 'center'
            },
            include: [{ model: BottleType, as: 'bottleType' }],
            order: [['filledDate', 'ASC']]
        });

        res.json({ success: true, data: bottles.map(formatBottle) });
    } catch (error) {
        console.error('Error fetching filled bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single bottle
exports.getBottleById = async (req, res) => {
    try {
        const bottle = await Bottle.findByPk(req.params.id, {
            include: [{ model: BottleType, as: 'bottleType' }]
        });

        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }

        res.json({ success: true, data: formatBottle(bottle) });
    } catch (error) {
        console.error('Error fetching bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get bottle by serial number
exports.getBottleBySerial = async (req, res) => {
    try {
        const { serial } = req.params;

        const bottle = await Bottle.findOne({
            where: { serialNumber: serial },
            include: [{ model: BottleType, as: 'bottleType' }]
        });

        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }

        res.json({ success: true, data: formatBottle(bottle) });
    } catch (error) {
        console.error('Error fetching bottle by serial:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Receive empty bottle (when customer brings empty bottle to center)
exports.receiveBottle = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { serialNumber, bottleTypeId, customerId, notes } = req.body;

        if (!serialNumber && !bottleTypeId) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Serial number or bottle type is required' }
            });
        }

        let bottle = null;

        // If serial number is provided, try to find the bottle
        if (serialNumber) {
            bottle = await Bottle.findOne({ where: { serialNumber }, transaction: t });
        }

        // If no bottle found and no serial number, but we have a type + customer
        // We can pick ANY bottle that's with this customer of this type
        if (!bottle && customerId && bottleTypeId) {
            bottle = await Bottle.findOne({
                where: {
                    customerId,
                    bottleTypeId,
                    status: 'with_customer'
                },
                transaction: t
            });
        }

        if (bottle) {
            // Existing bottle - update status and location
            const previousStatus = bottle.status;
            const previousLocation = bottle.location;
            const bottleCustomer = bottle.customerId || customerId;

            await bottle.update({
                status: 'empty',
                location: 'center',
                customerId: null,
                customerName: null,
                lastReturnedDate: new Date()
            }, { transaction: t });

            // Log to ledger
            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'returned',
                previousStatus,
                newStatus: 'empty',
                previousLocation,
                newLocation: 'center',
                customerId: bottleCustomer || null,
                notes: notes || 'Empty bottle received at center'
            }, { transaction: t });

            // Update customer bottle count if it was with a customer
            if (bottleCustomer) {
                const customer = await Customer.findByPk(bottleCustomer, { transaction: t });
                if (customer && customer.bottlesInHand > 0) {
                    await customer.update({
                        bottlesInHand: customer.bottlesInHand - 1
                    }, { transaction: t });
                }
            }
        } else if (serialNumber) {
            // New bottle with serial number
            let capacityLiters = 40; // default
            if (bottleTypeId) {
                const bottleType = await BottleType.findByPk(bottleTypeId, { transaction: t });
                if (bottleType) capacityLiters = bottleType.capacityLiters;
            }

            bottle = await Bottle.create({
                id: generateId('bot'),
                serialNumber,
                capacityLiters,
                bottleTypeId: bottleTypeId || null,
                status: 'empty',
                location: 'center',
                receivedDate: new Date()
            }, { transaction: t });

            // Log to ledger
            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'received',
                previousStatus: null,
                newStatus: 'empty',
                previousLocation: null,
                newLocation: 'center',
                notes: notes || `New bottle received at center`
            }, { transaction: t });
        } else {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Could not identify bottle to receive. Please provide a serial number.' }
            });
        }

        await t.commit();

        res.json({
            success: true,
            data: formatBottle(bottle),
            message: 'Bottle received successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error receiving bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Receive multiple bottles (Batch mode)
exports.receiveBottlesBulk = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { items, customerId, notes } = req.body; // items: [{ bottleTypeId, count }]

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Items array is required' }
            });
        }

        const processed = [];
        let totalReceived = 0;

        for (const entry of items) {
            const { bottleTypeId, count } = entry;

            for (let i = 0; i < count; i++) {
                let bottle = null;

                // Try to find a bottle with this customer of this type
                if (customerId) {
                    bottle = await Bottle.findOne({
                        where: {
                            customerId,
                            bottleTypeId,
                            status: 'with_customer',
                            id: { [Op.notIn]: processed.map(p => p.id) }
                        },
                        transaction: t
                    });
                }

                // If not found, find ANY untracked bottle of this type (we'll just create a placeholder if needed?)
                // Actually, the user wants to "add the count". If we don't have enough tracked bottles, we'll create new nameless ones.
                if (!bottle) {
                    const bType = await BottleType.findByPk(bottleTypeId, { transaction: t });
                    bottle = await Bottle.create({
                        id: generateId('bot'),
                        serialNumber: null, // Optional serial
                        capacityLiters: parseFloat(bType?.capacityLiters) || 40,
                        bottleTypeId: bottleTypeId,
                        status: 'empty',
                        location: 'center',
                        receivedDate: new Date(),
                        notes: 'Automatically created during bulk receive'
                    }, { transaction: t });
                } else {
                    await bottle.update({
                        status: 'empty',
                        location: 'center',
                        customerId: null,
                        customerName: null,
                        lastReturnedDate: new Date()
                    }, { transaction: t });
                }

                processed.push(bottle);
                totalReceived++;

                // Ledger
                await BottleLedger.create({
                    id: generateId('bl'),
                    bottleId: bottle.id,
                    serialNumber: bottle.serialNumber,
                    operationType: 'returned',
                    previousStatus: 'with_customer',
                    newStatus: 'empty',
                    newLocation: 'center',
                    customerId: customerId || null,
                    notes: notes || 'Bulk receive'
                }, { transaction: t });
            }
        }

        // Update customer count
        if (customerId) {
            const customer = await Customer.findByPk(customerId, { transaction: t });
            if (customer) {
                await customer.update({
                    bottlesInHand: Math.max(0, customer.bottlesInHand - totalReceived)
                }, { transaction: t });
            }
        }

        await createNotification(
            'bottle_return',
            'Bulk Return Received',
            `Received ${totalReceived} bottles ${customerId ? `from ${customerId}` : ''}`,
            'low',
            'customer',
            customerId,
            { totalReceived, customerId },
            t
        );

        await t.commit();
        res.json({ success: true, count: totalReceived, message: `Successfully received ${totalReceived} bottles` });
    } catch (error) {
        await t.rollback();
        console.error('Error in bulk receive:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create new bottle (add to inventory)
exports.createBottle = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { serialNumber, capacityLiters, bottleTypeId, ownerId, ownerName, notes } = req.body;

        if (!serialNumber) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Serial number is required' }
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

        // Get capacity from bottle type if provided
        let finalCapacity = capacityLiters;
        if (bottleTypeId && !capacityLiters) {
            const bottleType = await BottleType.findByPk(bottleTypeId);
            if (bottleType) {
                finalCapacity = bottleType.capacityLiters;
            }
        }

        if (!finalCapacity) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Capacity is required' }
            });
        }

        const bottle = await Bottle.create({
            id: generateId('bot'),
            serialNumber,
            capacityLiters: finalCapacity,
            bottleTypeId: bottleTypeId || null,
            status: 'empty',
            location: 'center',
            ownerId: ownerId || null,
            ownerName: ownerName || null,
            receivedDate: new Date(),
            notes
        }, { transaction: t });

        // Log to ledger
        await BottleLedger.create({
            id: generateId('bl'),
            bottleId: bottle.id,
            serialNumber: bottle.serialNumber,
            operationType: 'created',
            previousStatus: null,
            newStatus: 'empty',
            newLocation: 'center',
            notes: `New bottle created with capacity ${finalCapacity}L` + (ownerId ? ` (Owner: ${ownerName || ownerId})` : '')
        }, { transaction: t });

        // Update customer owned bottles count if applicable
        if (ownerId) {
            const customer = await Customer.findByPk(ownerId, { transaction: t });
            if (customer) {
                await customer.update({
                    ownedBottles: (customer.ownedBottles || 0) + 1
                }, { transaction: t });
            }
        }

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
        const { serialNumber, capacityLiters, bottleTypeId, status, notes } = req.body;

        await bottle.update({
            serialNumber: serialNumber !== undefined ? serialNumber : bottle.serialNumber,
            capacityLiters: capacityLiters !== undefined ? capacityLiters : bottle.capacityLiters,
            bottleTypeId: bottleTypeId !== undefined ? bottleTypeId : bottle.bottleTypeId,
            status: status !== undefined ? status : bottle.status,
            notes: notes !== undefined ? notes : bottle.notes
        }, { transaction: t });

        // Log to ledger
        await BottleLedger.create({
            id: generateId('bl'),
            bottleId: bottle.id,
            serialNumber: bottle.serialNumber,
            operationType: 'updated',
            previousStatus: previousStatus,
            newStatus: status || previousStatus,
            notes: 'Bottle details updated'
        }, { transaction: t });

        await t.commit();

        res.json({ success: true, data: formatBottle(bottle), message: 'Bottle updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating bottle:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Fill bottles from main tank (single or bulk)
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

        // Get bottles with their types
        const bottles = await Bottle.findAll({
            where: {
                id: { [Op.in]: bottleIds },
                status: 'empty',
                location: 'center'
            },
            include: [{ model: BottleType, as: 'bottleType' }],
            transaction: t
        });

        if (bottles.length !== bottleIds.length) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Some bottles are not empty or not in center' }
            });
        }

        // Calculate total KG needed based on bottle types
        let totalKgNeeded = 0;
        for (const bottle of bottles) {
            if (bottle.bottleType && bottle.bottleType.refillKg) {
                totalKgNeeded += parseFloat(bottle.bottleType.refillKg) || 0;
            } else {
                // Fallback calculation: estimate based on capacity (rough conversion)
                // Assuming ~0.2 kg per liter for oxygen
                totalKgNeeded += (parseFloat(bottle.capacityLiters) || 0) * 0.2;
            }
        }

        // Get main tank
        let tank = await MainTank.findOne({ transaction: t });
        if (!tank) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Main tank not configured' }
            });
        }

        const currentLevelKg = parseFloat(tank.currentLevelKg) || 0;

        if (currentLevelKg < totalKgNeeded) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_OXYGEN',
                    message: `Insufficient oxygen in main tank. Available: ${currentLevelKg.toFixed(2)}kg, Required: ${totalKgNeeded.toFixed(2)}kg`
                }
            });
        }

        // Update bottles to filled status
        const now = new Date();
        for (const bottle of bottles) {
            await bottle.update({
                status: 'filled',
                filledDate: now,
                fillCount: (bottle.fillCount || 0) + 1
            }, { transaction: t });
        }

        // Update main tank
        const newLevelKg = currentLevelKg - totalKgNeeded;
        await tank.update({
            currentLevelKg: newLevelKg,
            // Also update legacy liters field (rough conversion)
            currentLevelLiters: newLevelKg * 5 // rough conversion
        }, { transaction: t });

        // Add tank history
        const tankHistoryRecord = await TankHistory.create({
            id: generateId('th'),
            mainTankId: tank.id,
            supplierId: null,
            operationType: 'fill_bottles',
            kgBefore: currentLevelKg,
            kgChanged: totalKgNeeded,
            kgAfter: newLevelKg,
            bottlesFilled: bottles.length,
            bottleIds: bottleIds,
            notes: `Filled ${bottles.length} bottles using ${totalKgNeeded.toFixed(2)}kg`
        }, { transaction: t });

        // Log each bottle to ledger
        for (const bottle of bottles) {
            const kgUsed = (bottle.bottleType && bottle.bottleType.refillKg)
                ? parseFloat(bottle.bottleType.refillKg)
                : (parseFloat(bottle.capacityLiters) || 0) * 0.2;

            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'filled',
                previousStatus: 'empty',
                newStatus: 'filled',
                tankHistoryId: tankHistoryRecord.id,
                kgUsed: kgUsed,
                litersUsed: bottle.capacityLiters,
                notes: `Filled from main tank using ${kgUsed.toFixed(3)}kg`
            }, { transaction: t });
        }

        // Check for low tank notification
        const capacityKg = parseFloat(tank.capacityTons || 10) * 1000;
        const lowAlertKg = parseFloat(tank.lowLevelAlertKg) || 500;
        const criticalAlertKg = parseFloat(tank.criticalLevelAlertKg) || 100;

        if (newLevelKg <= criticalAlertKg) {
            await createNotification(
                'tank_critical',
                'Critical Tank Level!',
                `Tank level is critically low: ${newLevelKg.toFixed(2)}kg remaining`,
                'critical',
                'tank',
                tank.id,
                { currentLevel: newLevelKg, threshold: criticalAlertKg },
                t
            );
        } else if (newLevelKg <= lowAlertKg) {
            await createNotification(
                'tank_low',
                'Low Tank Level',
                `Tank level is low: ${newLevelKg.toFixed(2)}kg remaining`,
                'high',
                'tank',
                tank.id,
                { currentLevel: newLevelKg, threshold: lowAlertKg },
                t
            );
        }

        await t.commit();

        // Get updated bottles
        const updatedBottles = await Bottle.findAll({
            where: { id: { [Op.in]: bottleIds } },
            include: [{ model: BottleType, as: 'bottleType' }]
        });

        res.json({
            success: true,
            data: updatedBottles.map(formatBottle),
            message: `${bottles.length} bottles filled successfully. Used ${totalKgNeeded.toFixed(2)}kg. Tank level: ${newLevelKg.toFixed(2)}kg`,
            tankLevel: newLevelKg,
            kgUsed: totalKgNeeded
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
        const { active } = req.query;
        const where = {};

        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const types = await BottleType.findAll({
            where,
            order: [['capacityLiters', 'ASC']]
        });
        res.json({ success: true, data: types.map(formatBottleType) });
    } catch (error) {
        console.error('Error fetching bottle types:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get bottle type by ID
exports.getBottleTypeById = async (req, res) => {
    try {
        const type = await BottleType.findByPk(req.params.id);

        if (!type) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle type not found' } });
        }

        res.json({ success: true, data: formatBottleType(type) });
    } catch (error) {
        console.error('Error fetching bottle type:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create bottle type
exports.createBottleType = async (req, res) => {
    try {
        const { name, capacityLiters, refillKg, pricePerFill, depositAmount, description } = req.body;

        if (!name || !capacityLiters || !refillKg || !pricePerFill) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Name, capacity, refill kg, and price per fill are required' }
            });
        }

        const type = await BottleType.create({
            id: generateId('type'),
            name,
            capacityLiters,
            refillKg,
            pricePerFill,
            depositAmount: depositAmount || 0,
            description: description || null,
            isActive: true
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

        const { name, capacityLiters, refillKg, pricePerFill, depositAmount, description, isActive } = req.body;

        await type.update({
            name: name !== undefined ? name : type.name,
            capacityLiters: capacityLiters !== undefined ? capacityLiters : type.capacityLiters,
            refillKg: refillKg !== undefined ? refillKg : type.refillKg,
            pricePerFill: pricePerFill !== undefined ? pricePerFill : type.pricePerFill,
            depositAmount: depositAmount !== undefined ? depositAmount : type.depositAmount,
            description: description !== undefined ? description : type.description,
            isActive: isActive !== undefined ? isActive : type.isActive
        });

        res.json({ success: true, data: formatBottleType(type), message: 'Bottle type updated successfully' });
    } catch (error) {
        console.error('Error updating bottle type:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Delete bottle type
exports.deleteBottleType = async (req, res) => {
    try {
        const type = await BottleType.findByPk(req.params.id);

        if (!type) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle type not found' } });
        }

        // Check if any bottles use this type
        const bottleCount = await Bottle.count({ where: { bottleTypeId: type.id } });
        if (bottleCount > 0) {
            // Soft delete
            await type.update({ isActive: false });
            return res.json({ success: true, message: 'Bottle type deactivated (has associated bottles)' });
        }

        await type.destroy();
        res.json({ success: true, message: 'Bottle type deleted successfully' });
    } catch (error) {
        console.error('Error deleting bottle type:', error);
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
    previousLocation: entry.previousLocation,
    newLocation: entry.newLocation,
    customerId: entry.customerId,
    customerName: entry.customerName,
    transactionId: entry.transactionId,
    saleId: entry.saleId,
    tankHistoryId: entry.tankHistoryId,
    kgUsed: parseFloat(entry.kgUsed) || 0,
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
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }
            ],
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

        const bottle = await Bottle.findByPk(id, {
            include: [{ model: BottleType, as: 'bottleType' }]
        });
        if (!bottle) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bottle not found' } });
        }

        const entries = await BottleLedger.findAll({
            where: { bottleId: id },
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }
            ],
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

// Get ledger by customer (customer's bottle history)
exports.getCustomerBottleLedger = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit = 100 } = req.query;

        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        const entries = await BottleLedger.findAll({
            where: { customerId },
            include: [
                { model: Bottle, as: 'bottle', include: [{ model: BottleType, as: 'bottleType' }] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        // Get bottles currently with customer
        const currentBottles = await Bottle.findAll({
            where: { customerId, status: 'with_customer' },
            include: [{ model: BottleType, as: 'bottleType' }]
        });

        res.json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    bottlesInHand: customer.bottlesInHand,
                    ownedBottles: customer.ownedBottles,
                    totalCredit: parseFloat(customer.totalCredit) || 0
                },
                currentBottles: currentBottles.map(formatBottle),
                ledger: entries.map(formatLedgerEntry)
            }
        });
    } catch (error) {
        console.error('Error fetching customer bottle ledger:', error);
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

        // Get total kg used
        const totalKg = await BottleLedger.sum('kgUsed', { where }) || 0;

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
                totalKgUsed: parseFloat(totalKg),
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
            bottleSerialNumber: entry.serialNumber,
            bottleCapacity: parseFloat(entry.litersUsed) || 0,
            capacityLiters: parseFloat(entry.litersUsed) || 0,
            litersUsed: parseFloat(entry.litersUsed) || 0,
            kgUsed: parseFloat(entry.kgUsed) || 0,
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
