const { User, Role } = require('../../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login user
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { phone, password } = req.body;

        // Find user by phone with role
        const user = await User.findOne({ 
            where: { phone },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'displayName', 'level']
            }]
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is disabled
        if (user.isDisabled) {
            return res.status(403).json({
                success: false,
                message: 'Account is disabled. Please contact administrator.'
            });
        }

        // Check if user is deleted
        if (user.isDeleted) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deleted.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                phone: user.phone, 
                roleId: user.roleId,
                roleName: user.role.name,
                roleLevel: user.role.level
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN}
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { 
                id: user.id,
                phone: user.phone,
                roleId: user.roleId
            },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// Refresh access token
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Verify user still exists and is active
        const user = await User.findOne({ 
            where: { 
                id: decoded.id,
                isDeleted: false,
                isDisabled: false
            },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'displayName', 'level']
            }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or account disabled'
            });
        }

        // Generate new access token
        const newToken = jwt.sign(
            { 
                id: user.id, 
                phone: user.phone, 
                roleId: user.roleId,
                roleName: user.role.name,
                roleLevel: user.role.level
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// Logout user (stateless - client should discard tokens)
exports.logout = async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully. Please discard your tokens.'
        });
    } catch (error) {
        next(error);
    }
};
