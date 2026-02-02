const { Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

// Generate unique ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format notification for response
const formatNotification = (notif) => ({
    id: notif.id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    priority: notif.priority,
    entityType: notif.entityType,
    entityId: notif.entityId,
    data: notif.data,
    isRead: notif.isRead,
    readAt: notif.readAt,
    userId: notif.userId,
    createdAt: notif.createdAt
});

// Get all notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const { type, priority, isRead, limit = 50 } = req.query;
        const where = {};

        if (type) where.type = type;
        if (priority) where.priority = priority;
        if (isRead !== undefined) where.isRead = isRead === 'true';

        const notifications = await Notification.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({ success: true, data: notifications.map(formatNotification) });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get unread notifications
exports.getUnreadNotifications = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const notifications = await Notification.findAll({
            where: { isRead: false },
            order: [
                [sequelize.literal(`CASE priority 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                    ELSE 5 END`), 'ASC'],
                ['createdAt', 'DESC']
            ],
            limit: parseInt(limit)
        });

        const unreadCount = await Notification.count({ where: { isRead: false } });

        res.json({
            success: true,
            data: {
                notifications: notifications.map(formatNotification),
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get notification by ID
exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        }

        res.json({ success: true, data: formatNotification(notification) });
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Create notification
exports.createNotification = async (req, res) => {
    try {
        const { type, title, message, priority = 'medium', entityType, entityId, data, userId } = req.body;

        if (!type || !title || !message) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Type, title, and message are required' }
            });
        }

        const notification = await Notification.create({
            id: generateId('notif'),
            type,
            title,
            message,
            priority,
            entityType,
            entityId,
            data,
            userId,
            isRead: false
        });

        res.status(201).json({ success: true, data: formatNotification(notification), message: 'Notification created' });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        }

        await notification.update({
            isRead: true,
            readAt: new Date()
        });

        res.json({ success: true, data: formatNotification(notification), message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const { type } = req.query;
        const where = { isRead: false };

        if (type) where.type = type;

        const [updatedCount] = await Notification.update(
            { isRead: true, readAt: new Date() },
            { where }
        );

        res.json({ success: true, message: `${updatedCount} notifications marked as read` });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        }

        await notification.destroy();

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Clear old notifications
exports.clearOldNotifications = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const deletedCount = await Notification.destroy({
            where: {
                createdAt: { [Op.lt]: cutoffDate },
                isRead: true
            }
        });

        res.json({ success: true, message: `${deletedCount} old notifications cleared` });
    } catch (error) {
        console.error('Error clearing old notifications:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};

// Get notification summary
exports.getNotificationSummary = async (req, res) => {
    try {
        const unreadByType = await Notification.findAll({
            where: { isRead: false },
            attributes: [
                'type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['type'],
            raw: true
        });

        const unreadByPriority = await Notification.findAll({
            where: { isRead: false },
            attributes: [
                'priority',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['priority'],
            raw: true
        });

        const totalUnread = await Notification.count({ where: { isRead: false } });
        const criticalCount = await Notification.count({
            where: { isRead: false, priority: 'critical' }
        });

        res.json({
            success: true,
            data: {
                totalUnread,
                criticalCount,
                byType: unreadByType.reduce((acc, curr) => {
                    acc[curr.type] = parseInt(curr.count);
                    return acc;
                }, {}),
                byPriority: unreadByPriority.reduce((acc, curr) => {
                    acc[curr.priority] = parseInt(curr.count);
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error fetching notification summary:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
};
