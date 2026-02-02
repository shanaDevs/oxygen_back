const { Sale, SalePayment, Customer, Bottle, BottleType, BottleLedger, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate invoice number
const generateInvoiceNumber = async () => {
    const today = new Date();
    const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    // Get count of invoices today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await Sale.count({
        where: {
            createdAt: {
                [Op.between]: [startOfDay, endOfDay]
            }
        }
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

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

// Format sale for response
const formatSale = (sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    items: sale.items || [],
    bottleCount: sale.bottleCount || 0,
    subtotal: parseFloat(sale.subtotal) || 0,
    tax: parseFloat(sale.tax) || 0,
    taxPercentage: parseFloat(sale.taxPercentage) || 0,
    discount: parseFloat(sale.discount) || 0,
    discountPercentage: parseFloat(sale.discountPercentage) || 0,
    total: parseFloat(sale.total) || 0,
    paymentMethod: sale.paymentMethod,
    amountPaid: parseFloat(sale.amountPaid) || 0,
    creditAmount: parseFloat(sale.creditAmount) || 0,
    changeAmount: parseFloat(sale.changeAmount) || 0,
    status: sale.status,
    paymentStatus: sale.paymentStatus,
    userId: sale.userId,
    userName: sale.userName,
    notes: sale.notes,
    saleDate: sale.saleDate,
    createdAt: sale.createdAt,
    customer: sale.customer ? {
        id: sale.customer.id,
        name: sale.customer.name,
        phone: sale.customer.phone,
        totalCredit: parseFloat(sale.customer.totalCredit) || 0
    } : null,
    payments: sale.payments ? sale.payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        paymentMethod: p.paymentMethod,
        paymentType: p.paymentType,
        reference: p.reference,
        paymentDate: p.paymentDate
    })) : []
});

// Get all sales
exports.getAllSales = async (req, res) => {
    try {
        const { status, paymentStatus, customerId, startDate, endDate, limit = 100 } = req.query;
        const where = {};

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (customerId) where.customerId = customerId;

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate[Op.gte] = new Date(startDate);
            if (endDate) where.saleDate[Op.lte] = new Date(endDate);
        }

        const sales = await Sale.findAll({
            where,
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({ success: true, data: sales.map(formatSale) });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get single sale
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findByPk(req.params.id, {
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ]
        });

        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }

        res.json({ success: true, data: formatSale(sale) });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get sale by invoice number
exports.getSaleByInvoice = async (req, res) => {
    try {
        const { invoiceNumber } = req.params;

        const sale = await Sale.findOne({
            where: { invoiceNumber },
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ]
        });

        if (!sale) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }

        res.json({ success: true, data: formatSale(sale) });
    } catch (error) {
        console.error('Error fetching sale by invoice:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create sale (POS transaction)
exports.createSale = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            customerId,
            bottleIds,
            items: providedItems,
            returnedBottles, // [{ serialNumber, bottleTypeId, notes }]
            taxPercentage = 0,
            discountPercentage = 0,
            discount = 0,
            paymentMethod = 'cash',
            amountPaid = 0,
            notes,
            userId,
            userName
        } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Customer is required' }
            });
        }

        if ((!bottleIds || bottleIds.length === 0) && (!providedItems || providedItems.length === 0) && (!returnedBottles || returnedBottles.length === 0)) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'At least one operation (sale or return) is required' }
            });
        }

        // Get customer
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        let items = [];
        let bottles = [];

        // 1. Process Issued Bottles (Sales)
        const itemsToProcess = providedItems || [];
        if (bottleIds && bottleIds.length > 0 && itemsToProcess.length === 0) {
            // Support legacy bottleIds array if items not provided
            for (const bId of bottleIds) {
                const b = await Bottle.findByPk(bId, { include: [{ model: BottleType, as: 'bottleType' }], transaction: t });
                if (b) bottles.push(b);
            }
        } else {
            // Process provided items with optional serials/ids
            for (const item of itemsToProcess) {
                let bottle = null;

                // Priority 1: Use specific ID if provided
                if (item.bottleId) {
                    bottle = await Bottle.findOne({
                        where: { id: item.bottleId, status: 'filled', location: 'center' },
                        include: [{ model: BottleType, as: 'bottleType' }],
                        transaction: t
                    });
                }

                // Priority 2: Use Serial Number if provided
                if (!bottle && item.serialNumber) {
                    bottle = await Bottle.findOne({
                        where: { serial_number: item.serialNumber, status: 'filled', location: 'center' },
                        include: [{ model: BottleType, as: 'bottleType' }],
                        transaction: t
                    });
                }

                // Priority 3: Pick ANY available bottle of this type
                if (!bottle && item.bottleTypeId) {
                    bottle = await Bottle.findOne({
                        where: {
                            bottle_type_id: item.bottleTypeId,
                            status: 'filled',
                            location: 'center',
                            id: { [Op.notIn]: bottles.map(b => b.id) } // Don't pick same bottle twice in one sale
                        },
                        include: [{ model: BottleType, as: 'bottleType' }],
                        transaction: t
                    });
                }

                if (!bottle) {
                    await t.rollback();
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'OUT_OF_STOCK',
                            message: `No available filled bottles of type ${item.bottleTypeName || item.bottleTypeId || 'unknown'} ${item.serialNumber ? `with serial ${item.serialNumber}` : ''}`
                        }
                    });
                }

                bottles.push(bottle);
            }
        }

        // Build final items list from resolved bottles
        items = bottles.map(bottle => ({
            bottleId: bottle.id,
            serialNumber: bottle.serialNumber,
            bottleTypeId: bottle.bottleTypeId,
            bottleTypeName: bottle.bottleType?.name || 'Unknown',
            capacityLiters: parseFloat(bottle.capacityLiters) || 0,
            refillKg: bottle.bottleType ? parseFloat(bottle.bottleType.refillKg) || 0 : 0,
            price: bottle.bottleType ? parseFloat(bottle.bottleType.pricePerFill) || 0 : 0
        }));

        // 2. Process Returned Bottles
        let processedReturns = [];
        if (returnedBottles && returnedBottles.length > 0) {
            for (const ret of returnedBottles) {
                let bottle = await Bottle.findOne({
                    where: { serialNumber: ret.serialNumber },
                    transaction: t
                });

                if (bottle) {
                    const previousStatus = bottle.status;
                    const previousLocation = bottle.location;

                    // Update existing bottle
                    await bottle.update({
                        status: 'empty',
                        location: 'center',
                        customerId: null,
                        customerName: null,
                        lastReturnedDate: new Date()
                    }, { transaction: t });

                    processedReturns.push({
                        bottleId: bottle.id,
                        serialNumber: bottle.serialNumber,
                        type: 'existing',
                        previousStatus
                    });
                } else {
                    // Create new bottle if it doesn't exist
                    let capacityLiters = 40;
                    if (ret.bottleTypeId) {
                        const bType = await BottleType.findByPk(ret.bottleTypeId, { transaction: t });
                        if (bType) capacityLiters = bType.capacityLiters;
                    }

                    bottle = await Bottle.create({
                        id: generateId('bot'),
                        serialNumber: ret.serialNumber,
                        capacityLiters,
                        bottleTypeId: ret.bottleTypeId || null,
                        status: 'empty',
                        location: 'center',
                        receivedDate: new Date(),
                        notes: ret.notes || 'Added during return flow'
                    }, { transaction: t });

                    processedReturns.push({
                        bottleId: bottle.id,
                        serialNumber: bottle.serialNumber,
                        type: 'new'
                    });
                }

                // Log to ledger
                await BottleLedger.create({
                    id: generateId('bl'),
                    bottleId: bottle.id,
                    serialNumber: bottle.serialNumber,
                    operationType: 'returned',
                    previousStatus: bottle ? bottle.status : null,
                    newStatus: 'empty',
                    previousLocation: bottle ? bottle.location : null,
                    newLocation: 'center',
                    customerId: customer.id,
                    customerName: customer.name,
                    notes: ret.notes || `Returned via sale transaction`
                }, { transaction: t });
            }
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
        const taxAmount = (subtotal * (parseFloat(taxPercentage) || 0)) / 100;
        const discountAmount = discount > 0
            ? parseFloat(discount)
            : (subtotal * (parseFloat(discountPercentage) || 0)) / 100;
        const total = subtotal + taxAmount - discountAmount;

        // Calculate payment
        const paid = parseFloat(amountPaid) || 0;
        let creditAmount = 0;
        let changeAmount = 0;
        let finalPaymentStatus = 'full';

        if (paymentMethod === 'credit') {
            creditAmount = total;
            finalPaymentStatus = 'pending';
        } else if (paymentMethod === 'partial') {
            creditAmount = Math.max(0, total - paid);
            changeAmount = Math.max(0, paid - total);
            finalPaymentStatus = creditAmount > 0 ? 'partial' : 'full';
        } else {
            changeAmount = Math.max(0, paid - total);
            finalPaymentStatus = 'full';
        }

        const invoiceNumber = await generateInvoiceNumber();

        // Create sale record
        const sale = await Sale.create({
            id: generateId('sale'),
            invoiceNumber,
            customerId,
            customerName: customer.name,
            customerPhone: customer.phone,
            items,
            returns: processedReturns, // Store returns in sale record
            bottleCount: items.length,
            returnCount: processedReturns.length,
            subtotal,
            tax: taxAmount,
            taxPercentage: parseFloat(taxPercentage) || 0,
            discount: discountAmount,
            discountPercentage: parseFloat(discountPercentage) || 0,
            total,
            paymentMethod,
            amountPaid: paid,
            creditAmount,
            changeAmount,
            status: 'completed',
            paymentStatus: finalPaymentStatus,
            userId: userId || null,
            userName: userName || null,
            notes,
            saleDate: new Date()
        }, { transaction: t });

        if (paid > 0) {
            await SalePayment.create({
                id: generateId('pay'),
                saleId: sale.id,
                customerId,
                amount: paid,
                paymentMethod: paymentMethod === 'partial' ? 'cash' : paymentMethod,
                paymentType: 'sale',
                receivedBy: userName || null,
                paymentDate: new Date()
            }, { transaction: t });
        }

        // Update Issued Bottles
        for (const bottle of bottles) {
            await bottle.update({
                status: 'with_customer',
                location: 'customer',
                customerId: customer.id,
                customerName: customer.name,
                issuedDate: new Date(),
                issueCount: (bottle.issueCount || 0) + 1
            }, { transaction: t });

            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'issued',
                previousStatus: 'filled',
                newStatus: 'with_customer',
                previousLocation: 'center',
                newLocation: 'customer',
                customerId: customer.id,
                customerName: customer.name,
                saleId: sale.id,
                amount: bottle.bottleType ? parseFloat(bottle.bottleType.pricePerFill) : 0,
                notes: `Issued via sale ${invoiceNumber}`
            }, { transaction: t });
        }

        // Update customer bottles search result
        // Net change = items.length (issued) - processedReturns.length (returned)
        const netBottleChange = items.length - processedReturns.length;

        await customer.update({
            bottlesInHand: Math.max(0, customer.bottlesInHand + netBottleChange),
            totalCredit: parseFloat(customer.totalCredit) + creditAmount,
            totalPurchases: parseFloat(customer.totalPurchases || 0) + total,
            totalPaid: parseFloat(customer.totalPaid || 0) + paid,
            totalFills: (customer.totalFills || 0) + items.length,
            loyaltyPoints: (customer.loyaltyPoints || 0) + Math.floor(paid / 100)
        }, { transaction: t });

        await createNotification(
            'sale_complete',
            'Sale Completed',
            `Sale ${invoiceNumber}: Issued ${items.length}, Returned ${processedReturns.length}. Total: Rs.${total.toFixed(2)}`,
            'low',
            'sale',
            sale.id,
            { invoiceNumber, customerName: customer.name, total, issued: items.length, returned: processedReturns.length },
            t
        );

        await t.commit();

        const completedSale = await Sale.findByPk(sale.id, {
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ]
        });

        res.status(201).json({
            success: true,
            data: formatSale(completedSale),
            message: `Sale completed successfully. Invoice: ${invoiceNumber}`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Add payment to existing sale (for outstanding)
exports.addPayment = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { saleId } = req.params;
        const { amount, paymentMethod = 'cash', reference, notes, receivedBy } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Valid payment amount is required' }
            });
        }

        const sale = await Sale.findByPk(saleId, {
            include: [{ model: Customer, as: 'customer' }],
            transaction: t
        });

        if (!sale) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }

        const currentCredit = parseFloat(sale.creditAmount) || 0;
        if (currentCredit <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No outstanding balance' } });
        }

        const paymentAmount = Math.min(parseFloat(amount), currentCredit);
        const newCredit = currentCredit - paymentAmount;
        const newPaymentStatus = newCredit <= 0 ? 'full' : 'partial';

        // Create payment record
        await SalePayment.create({
            id: generateId('pay'),
            saleId: sale.id,
            customerId: sale.customerId,
            amount: paymentAmount,
            paymentMethod,
            paymentType: 'outstanding',
            reference,
            notes,
            receivedBy,
            paymentDate: new Date()
        }, { transaction: t });

        // Update sale
        await sale.update({
            amountPaid: parseFloat(sale.amountPaid) + paymentAmount,
            creditAmount: newCredit,
            paymentStatus: newPaymentStatus
        }, { transaction: t });

        // Update customer
        if (sale.customer) {
            await sale.customer.update({
                totalCredit: Math.max(0, parseFloat(sale.customer.totalCredit) - paymentAmount),
                totalPaid: parseFloat(sale.customer.totalPaid || 0) + paymentAmount
            }, { transaction: t });
        }

        // Create notification
        await createNotification(
            'payment_received',
            'Payment Received',
            `Payment of Rs.${paymentAmount.toFixed(2)} received for invoice ${sale.invoiceNumber}`,
            'low',
            'sale',
            sale.id,
            {
                invoiceNumber: sale.invoiceNumber,
                paymentAmount,
                remainingCredit: newCredit
            },
            t
        );

        await t.commit();

        // Fetch updated sale
        const updatedSale = await Sale.findByPk(saleId, {
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ]
        });

        res.json({
            success: true,
            data: formatSale(updatedSale),
            message: `Payment of Rs.${paymentAmount.toFixed(2)} recorded successfully`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error adding payment:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get customer outstanding sales
exports.getCustomerOutstanding = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        const sales = await Sale.findAll({
            where: {
                customerId,
                creditAmount: { [Op.gt]: 0 }
            },
            include: [{ model: SalePayment, as: 'payments' }],
            order: [['createdAt', 'ASC']]
        });

        const totalOutstanding = sales.reduce((sum, s) => sum + (parseFloat(s.creditAmount) || 0), 0);

        res.json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    totalCredit: parseFloat(customer.totalCredit) || 0
                },
                sales: sales.map(formatSale),
                totalOutstanding
            }
        });
    } catch (error) {
        console.error('Error fetching customer outstanding:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get all outstanding sales
exports.getAllOutstanding = async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        const sales = await Sale.findAll({
            where: {
                creditAmount: { [Op.gt]: 0 }
            },
            include: [
                { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'totalCredit'] },
                { model: SalePayment, as: 'payments' }
            ],
            order: [['createdAt', 'ASC']],
            limit: parseInt(limit)
        });

        const totalOutstanding = sales.reduce((sum, s) => sum + (parseFloat(s.creditAmount) || 0), 0);

        res.json({
            success: true,
            data: {
                sales: sales.map(formatSale),
                totalOutstanding,
                count: sales.length
            }
        });
    } catch (error) {
        console.error('Error fetching outstanding sales:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Cancel sale
exports.cancelSale = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        const sale = await Sale.findByPk(id, {
            include: [{ model: Customer, as: 'customer' }],
            transaction: t
        });

        if (!sale) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } });
        }

        if (sale.status === 'cancelled') {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Sale already cancelled' } });
        }

        // Restore bottles
        const bottleIds = (sale.items || []).map(i => i.bottleId).filter(Boolean);
        if (bottleIds.length > 0) {
            const bottles = await Bottle.findAll({
                where: { id: { [Op.in]: bottleIds } },
                transaction: t
            });

            for (const bottle of bottles) {
                await bottle.update({
                    status: 'filled',
                    location: 'center',
                    customerId: null,
                    customerName: null
                }, { transaction: t });

                // Log to ledger
                await BottleLedger.create({
                    id: generateId('bl'),
                    bottleId: bottle.id,
                    serialNumber: bottle.serialNumber,
                    operationType: 'returned',
                    previousStatus: 'with_customer',
                    newStatus: 'filled',
                    previousLocation: 'customer',
                    newLocation: 'center',
                    saleId: sale.id,
                    notes: `Returned due to sale cancellation: ${reason || 'No reason provided'}`
                }, { transaction: t });
            }
        }

        // Update customer
        if (sale.customer) {
            await sale.customer.update({
                bottlesInHand: Math.max(0, sale.customer.bottlesInHand - sale.bottleCount),
                totalCredit: Math.max(0, parseFloat(sale.customer.totalCredit) - parseFloat(sale.creditAmount)),
                totalPurchases: Math.max(0, parseFloat(sale.customer.totalPurchases || 0) - parseFloat(sale.total)),
                totalPaid: Math.max(0, parseFloat(sale.customer.totalPaid || 0) - parseFloat(sale.amountPaid))
            }, { transaction: t });
        }

        // Update sale
        await sale.update({
            status: 'cancelled',
            notes: (sale.notes || '') + `\nCancelled: ${reason || 'No reason provided'}`
        }, { transaction: t });

        await t.commit();

        res.json({ success: true, data: formatSale(sale), message: 'Sale cancelled successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error cancelling sale:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get sales statistics
exports.getSalesStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = { status: 'completed' };
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate[Op.gte] = new Date(startDate);
            if (endDate) where.saleDate[Op.lte] = new Date(endDate);
        }

        const stats = await Sale.findAll({
            where,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
                [sequelize.fn('SUM', sequelize.col('bottle_count')), 'totalBottles'],
                [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
                [sequelize.fn('SUM', sequelize.col('amount_paid')), 'totalCollected'],
                [sequelize.fn('SUM', sequelize.col('credit_amount')), 'totalOutstanding']
            ],
            raw: true
        });

        // Get today's stats
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const todayStats = await Sale.findAll({
            where: {
                status: 'completed',
                saleDate: { [Op.between]: [startOfDay, endOfDay] }
            },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
                [sequelize.fn('SUM', sequelize.col('bottle_count')), 'totalBottles'],
                [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
                [sequelize.fn('SUM', sequelize.col('amount_paid')), 'totalCollected']
            ],
            raw: true
        });

        res.json({
            success: true,
            data: {
                overall: {
                    totalSales: parseInt(stats[0]?.totalSales) || 0,
                    totalBottles: parseInt(stats[0]?.totalBottles) || 0,
                    totalRevenue: parseFloat(stats[0]?.totalRevenue) || 0,
                    totalCollected: parseFloat(stats[0]?.totalCollected) || 0,
                    totalOutstanding: parseFloat(stats[0]?.totalOutstanding) || 0
                },
                today: {
                    totalSales: parseInt(todayStats[0]?.totalSales) || 0,
                    totalBottles: parseInt(todayStats[0]?.totalBottles) || 0,
                    totalRevenue: parseFloat(todayStats[0]?.totalRevenue) || 0,
                    totalCollected: parseFloat(todayStats[0]?.totalCollected) || 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching sales statistics:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
