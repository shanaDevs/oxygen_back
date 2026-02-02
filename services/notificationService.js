/**
 * Notification Helper Service
 * Auto-generates notifications for various system events
 */

const { Notification, MainTank, Customer, Bottle, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create a notification
 */
const createNotification = async (data, transaction = null) => {
    try {
        const notification = await Notification.create({
            id: generateId('notif'),
            type: data.type,
            title: data.title,
            message: data.message,
            priority: data.priority || 'medium',
            entityType: data.entityType || null,
            entityId: data.entityId || null,
            data: data.data || null,
            userId: data.userId || null,
            isRead: false
        }, { transaction });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};

/**
 * Check and notify for low tank level
 */
const checkTankLevel = async () => {
    try {
        const tank = await MainTank.findOne();
        if (!tank) return;

        const currentLevel = parseFloat(tank.currentLevelKg) || 0;
        const capacityKg = (parseFloat(tank.capacityTons) || 10) * 1000;
        const percentFull = (currentLevel / capacityKg) * 100;
        const remainingToFill = capacityKg - currentLevel;

        const thresholds = [
            { percent: 25, priority: 'medium', type: 'tank_low' },
            { percent: 10, priority: 'high', type: 'tank_critical' },
            { percent: 5, priority: 'critical', type: 'tank_critical' }
        ];

        for (const threshold of thresholds) {
            if (percentFull <= threshold.percent) {
                // Check if we've already notified for THIS threshold recently
                const existingNotif = await Notification.findOne({
                    where: {
                        type: threshold.type,
                        isRead: false,
                        title: { [Op.like]: `%${threshold.percent}%` },
                        createdAt: { [Op.gte]: new Date(Date.now() - 12 * 60 * 60 * 1000) } // Within last 12 hours
                    }
                });

                if (!existingNotif) {
                    await createNotification({
                        type: threshold.type,
                        title: `Tank Level Alert: ${threshold.percent}% Remaining`,
                        message: `Tank is at ${percentFull.toFixed(1)}% (${currentLevel.toFixed(1)}kg). Suggested PO amount: ${remainingToFill.toFixed(1)}kg.`,
                        priority: threshold.priority,
                        entityType: 'tank',
                        entityId: tank.id,
                        data: {
                            currentLevel,
                            percentFull,
                            threshold: threshold.percent,
                            remainingToFill,
                            canCreatePO: true
                        }
                    });
                }
                // Stop after the first (lowest) threshold triggered
                break;
            }
        }
    } catch (error) {
        console.error('Error checking tank level:', error);
    }
};

/**
 * Notify on successful tank refill
 */
const notifyTankRefill = async (amountKg, supplierName, transaction = null) => {
    const tank = await MainTank.findOne({ transaction });
    const currentLevel = parseFloat(tank?.currentLevelKg) || 0;
    const capacityKg = (parseFloat(tank?.capacityTons) || 10) * 1000;
    const percentFull = (currentLevel / capacityKg) * 100;

    return await createNotification({
        type: 'tank_refill',
        title: 'Tank Refilled',
        message: `${amountKg}kg of oxygen added by ${supplierName}. Tank now at ${percentFull.toFixed(1)}%`,
        priority: 'low',
        entityType: 'tank',
        entityId: tank?.id,
        data: { amountKg, supplierName, newLevel: currentLevel }
    }, transaction);
};

/**
 * Notify on new sale completion
 */
const notifySaleComplete = async (sale, transaction = null) => {
    return await createNotification({
        type: 'sale_complete',
        title: 'New Sale Completed',
        message: `Invoice ${sale.invoiceNumber}: ${sale.bottleCount} bottles sold to ${sale.customerName || 'Walk-in'}. Total: Rs.${sale.total}`,
        priority: 'low',
        entityType: 'sale',
        entityId: sale.id,
        data: { invoiceNumber: sale.invoiceNumber, total: sale.total, bottleCount: sale.bottleCount }
    }, transaction);
};

/**
 * Notify on credit sale (customer owes money)
 */
const notifyCreditSale = async (sale, creditAmount, transaction = null) => {
    return await createNotification({
        type: 'credit_added',
        title: 'Credit Sale',
        message: `Rs.${creditAmount} credit added for ${sale.customerName}. Invoice: ${sale.invoiceNumber}`,
        priority: 'medium',
        entityType: 'sale',
        entityId: sale.id,
        data: { invoiceNumber: sale.invoiceNumber, creditAmount, customerId: sale.customerId }
    }, transaction);
};

/**
 * Check for customers with high outstanding credit
 */
const checkHighCreditCustomers = async () => {
    try {
        const highCreditThreshold = 10000; // Rs. 10,000
        const customers = await Customer.findAll({
            where: {
                totalCredit: { [Op.gte]: highCreditThreshold }
            }
        });

        for (const customer of customers) {
            // Check for existing notification for this customer
            const existingNotif = await Notification.findOne({
                where: {
                    type: 'high_credit',
                    entityId: customer.id,
                    isRead: false,
                    createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within last 7 days
                }
            });

            if (!existingNotif) {
                await createNotification({
                    type: 'high_credit',
                    title: 'High Outstanding Credit',
                    message: `${customer.name} has outstanding credit of Rs.${parseFloat(customer.totalCredit).toLocaleString()}`,
                    priority: 'high',
                    entityType: 'customer',
                    entityId: customer.id,
                    data: { customerId: customer.id, customerName: customer.name, amount: customer.totalCredit }
                });
            }
        }
    } catch (error) {
        console.error('Error checking high credit customers:', error);
    }
};

/**
 * Notify on payment received
 */
const notifyPaymentReceived = async (customerId, customerName, amount, transaction = null) => {
    return await createNotification({
        type: 'payment_received',
        title: 'Payment Received',
        message: `Rs.${amount} payment received from ${customerName}`,
        priority: 'low',
        entityType: 'customer',
        entityId: customerId,
        data: { customerId, amount }
    }, transaction);
};

/**
 * Notify on bottle issue
 */
const notifyBottlesIssued = async (customerId, customerName, bottleCount, transaction = null) => {
    return await createNotification({
        type: 'bottles_issued',
        title: 'Bottles Issued',
        message: `${bottleCount} bottle(s) issued to ${customerName}`,
        priority: 'low',
        entityType: 'customer',
        entityId: customerId,
        data: { customerId, bottleCount }
    }, transaction);
};

/**
 * Notify on bottle return
 */
const notifyBottlesReturned = async (customerId, customerName, bottleCount, transaction = null) => {
    return await createNotification({
        type: 'bottles_returned',
        title: 'Bottles Returned',
        message: `${bottleCount} bottle(s) returned by ${customerName}`,
        priority: 'low',
        entityType: 'customer',
        entityId: customerId,
        data: { customerId, bottleCount }
    }, transaction);
};

/**
 * Notify on low filled bottles inventory
 */
const checkFilledBottlesInventory = async () => {
    try {
        const filledCount = await Bottle.count({
            where: { status: 'filled', location: 'center' }
        });

        if (filledCount <= 5) {
            const existingNotif = await Notification.findOne({
                where: {
                    type: 'low_inventory',
                    isRead: false,
                    createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });

            if (!existingNotif) {
                await createNotification({
                    type: 'low_inventory',
                    title: 'Low Filled Bottles',
                    message: `Only ${filledCount} filled bottles available in center. Fill more bottles!`,
                    priority: filledCount === 0 ? 'critical' : 'high',
                    entityType: 'bottle',
                    entityId: null,
                    data: { filledCount }
                });
            }
        }
    } catch (error) {
        console.error('Error checking filled bottles inventory:', error);
    }
};

/**
 * Run all system checks
 */
const runSystemChecks = async () => {
    await checkTankLevel();
    await checkHighCreditCustomers();
    await checkFilledBottlesInventory();
};

module.exports = {
    createNotification,
    checkTankLevel,
    notifyTankRefill,
    notifySaleComplete,
    notifyCreditSale,
    checkHighCreditCustomers,
    notifyPaymentReceived,
    notifyBottlesIssued,
    notifyBottlesReturned,
    checkFilledBottlesInventory,
    runSystemChecks
};
