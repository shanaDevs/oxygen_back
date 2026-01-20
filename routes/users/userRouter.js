const express = require('express');
const router = express.Router();
const { userController } = require('../../controllers');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - phone
 *         - password
 *       properties:
 *         phone:
 *           type: string
 *           description: User phone number (10-11 digits)
 *           example: "1234567890"
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *           example: "password123"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *             token:
 *               type: string
 *             refreshToken:
 *               type: string
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token
 */

// Validation rules
const loginValidation = [
    body('phone').trim().isLength({ min: 10, max: 11 }).withMessage('Phone number must be 10-11 characters').matches(/^\d+$/).withMessage('Phone number must contain only digits'),
    body('password').notEmpty().withMessage('Password is required')
];

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account disabled or deleted
 */
router.post('/login', loginValidation, userController.login);

/**
 * @swagger
 * /api/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', userController.refreshToken);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Client should discard tokens after calling this endpoint
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', userController.logout);

module.exports = router;
