const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [tank_low, tank_critical, bottle_issue, bottle_return, payment_received, payment_due, sale_complete, refill_complete, system]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         entityType:
 *           type: string
 *         entityId:
 *           type: string
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications
 *     tags: [Notifications]
 */
router.get('/unread', notificationController.getUnreadNotifications);

/**
 * @swagger
 * /api/notifications/summary:
 *   get:
 *     summary: Get notification summary
 *     tags: [Notifications]
 */
router.get('/summary', notificationController.getNotificationSummary);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 */
router.post('/mark-all-read', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/clear-old:
 *   delete:
 *     summary: Clear old notifications
 *     tags: [Notifications]
 */
router.delete('/clear-old', notificationController.clearOldNotifications);

/**
 * @swagger
 * /api/notifications/run-checks:
 *   post:
 *     summary: Run system checks and generate notifications
 *     tags: [Notifications]
 */
router.post('/run-checks', async (req, res) => {
    try {
        const notificationService = require('../services/notificationService');
        await notificationService.runSystemChecks();
        res.json({ success: true, message: 'System checks completed' });
    } catch (error) {
        console.error('Error running system checks:', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 */
router.get('/', notificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 */
router.post('/', notificationController.createNotification);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 */
router.post('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
