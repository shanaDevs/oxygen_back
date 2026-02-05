const { CustomerTransaction, Customer, Bottle, BottleLedger, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format transaction for response
const formatTransaction = (tx) => ({
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

// Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const { customerId } = req.query;
        const where = {};

        if (customerId) {
            where.customerId = customerId;
        }

        const transactions = await CustomerTransaction.findAll({
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

// Issue bottles to customer
exports.issueBottles = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customerId, bottleIds, totalAmount, amountPaid, paymentStatus, notes } = req.body;

        if (!customerId || !bottleIds || !Array.isArray(bottleIds) || bottleIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Customer ID and bottle IDs are required' }
            });
        }

        // Get customer
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        // Get bottles and verify they are filled
        const bottles = await Bottle.findAll({
            where: {
                id: { [Op.in]: bottleIds },
                status: 'filled'
            },
            transaction: t
        });

        if (bottles.length !== bottleIds.length) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Some bottles are not filled or not found' }
            });
        }

        // Calculate credit amount
        const total = parseFloat(totalAmount) || 0;
        const paid = parseFloat(amountPaid) || 0;
        const credit = total - paid;

        // Update bottles to with_customer status
        await Bottle.update(
            {
                status: 'with_customer',
                location: 'customer',
                customerId: customerId,
                customerName: customer.name,
                issuedDate: new Date()
            },
            {
                where: { id: { [Op.in]: bottleIds } },
                transaction: t
            }
        );

        // Get bottle type info
        const bottleType = bottles.length > 0 ? `${bottles[0].capacityLiters}L` : 'Mixed';

        // Create transaction record
        const transaction = await CustomerTransaction.create({
            id: generateId('ctx'),
            customerId,
            customerName: customer.name,
            transactionType: 'issue',
            bottleIds: bottleIds,
            bottleCount: bottles.length,
            bottleType,
            totalAmount: total,
            amountPaid: paid,
            creditAmount: credit,
            paymentStatus: paymentStatus || (credit > 0 ? 'partial' : 'full'),
            notes: notes || null
        }, { transaction: t });

        // Log each bottle to ledger
        for (const bottle of bottles) {
            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'issued',
                previousStatus: 'filled',
                newStatus: 'with_customer',
                customerId: customerId,
                customerName: customer.name,
                transactionId: transaction.id,
                amount: total / bottles.length,
                notes: `Issued to customer: ${customer.name}`
            }, { transaction: t });
        }

        // Update customer stats
        await customer.update({
            bottlesInHand: customer.bottlesInHand + bottles.length,
            totalCredit: parseFloat(customer.totalCredit) + credit
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            data: formatTransaction(transaction),
            message: `${bottles.length} bottles issued to ${customer.name}`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error issuing bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Return bottles from customer
exports.returnBottles = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customerId, bottleIds, notes } = req.body;

        if (!customerId || !bottleIds || !Array.isArray(bottleIds) || bottleIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Customer ID and bottle IDs are required' }
            });
        }

        // Get customer
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        // Get bottles and verify they are with this customer
        const bottles = await Bottle.findAll({
            where: {
                id: { [Op.in]: bottleIds },
                status: 'with_customer',
                customerId: customerId
            },
            transaction: t
        });

        if (bottles.length !== bottleIds.length) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Some bottles are not with this customer or not found' }
            });
        }

        // Update bottles to empty status
        await Bottle.update(
            {
                status: 'empty',
                location: 'center',
                customerId: null,
                customerName: null,
                lastReturnedDate: new Date()
            },
            {
                where: { id: { [Op.in]: bottleIds } },
                transaction: t
            }
        );

        // Create transaction record
        const transaction = await CustomerTransaction.create({
            id: generateId('ctx'),
            customerId,
            customerName: customer.name,
            transactionType: 'return',
            bottleIds: bottleIds,
            bottleCount: bottles.length,
            bottleType: bottles.length > 0 ? `${bottles[0].capacityLiters}L` : 'Mixed',
            totalAmount: 0,
            amountPaid: 0,
            creditAmount: 0,
            paymentStatus: 'full',
            notes: notes || null
        }, { transaction: t });

        // Log each bottle to ledger
        for (const bottle of bottles) {
            await BottleLedger.create({
                id: generateId('bl'),
                bottleId: bottle.id,
                serialNumber: bottle.serialNumber,
                operationType: 'returned',
                previousStatus: 'with_customer',
                newStatus: 'empty',
                customerId: customerId,
                customerName: customer.name,
                transactionId: transaction.id,
                notes: `Returned from customer: ${customer.name}`
            }, { transaction: t });
        }

        // Update customer stats
        await customer.update({
            bottlesInHand: Math.max(0, customer.bottlesInHand - bottles.length)
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            data: formatTransaction(transaction),
            message: `${bottles.length} bottles returned from ${customer.name}`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error returning bottles:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Collect payment from customer
exports.collectPayment = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customerId, amount, notes } = req.body;

        if (!customerId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Customer ID and valid amount are required' }
            });
        }

        // Get customer
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        }

        const currentCredit = parseFloat(customer.totalCredit) || 0;
        const paymentAmount = parseFloat(amount);
        const newCredit = Math.max(0, currentCredit - paymentAmount);

        // Create transaction record
        const transaction = await CustomerTransaction.create({
            id: generateId('ctx'),
            customerId,
            customerName: customer.name,
            transactionType: 'payment',
            bottleIds: [],
            bottleCount: 0,
            bottleType: null,
            totalAmount: 0,
            amountPaid: paymentAmount,
            creditAmount: -paymentAmount,
            paymentStatus: 'full',
            notes: notes || `Payment collected: Rs. ${paymentAmount}`
        }, { transaction: t });

        // Update customer credit
        await customer.update({
            totalCredit: newCredit
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            data: formatTransaction(transaction),
            message: `Payment of Rs. ${paymentAmount} collected from ${customer.name}. Remaining credit: Rs. ${newCredit}`
        });
    } catch (error) {
        await t.rollback();
        console.error('Error collecting payment:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
