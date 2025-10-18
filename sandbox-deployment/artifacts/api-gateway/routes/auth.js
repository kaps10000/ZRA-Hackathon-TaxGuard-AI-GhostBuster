const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// In-memory user store (in production, use a database)
const users = [
    {
        id: 1,
        username: 'taxpayer1',
        password: '$2a$10$8g59/0SJdQtdupJtQoWiY.abMDgaPRjVR0cXKzuRi.VJWgEj2jgnC', // password123
        role: 'taxpayer',
        email: 'taxpayer@example.com'
    },
    {
        id: 2,
        username: 'auditor1',
        password: '$2a$10$8g59/0SJdQtdupJtQoWiY.abMDgaPRjVR0cXKzuRi.VJWgEj2jgnC', // password123
        role: 'auditor',
        email: 'auditor@zra.gov.zm'
    },
    {
        id: 3,
        username: 'admin1',
        password: '$2a$10$8g59/0SJdQtdupJtQoWiY.abMDgaPRjVR0cXKzuRi.VJWgEj2jgnC', // password123
        role: 'admin',
        email: 'admin@zra.gov.zm'
    }
];

// Login endpoint
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.security.authFailure({
                reason: 'validation_error',
                errors: errors.array(),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            logger.security.authFailure({
                reason: 'user_not_found',
                username,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Username or password is incorrect'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            logger.security.authFailure({
                reason: 'invalid_password',
                username,
                userId: user.id,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Username or password is incorrect'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        logger.security.authSuccess({
            userId: user.id,
            username: user.username,
            role: user.role,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            },
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

    } catch (error) {
        logger.error('Login Error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Login failed'
        });
    }
});

// Register endpoint (admin only)
router.post('/register', authenticateToken, authorizeRole(['admin']), [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['taxpayer', 'auditor', 'admin']).withMessage('Invalid role')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, password, email, role } = req.body;

        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'Username or email is already taken'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            email,
            role
        };

        users.push(newUser);

        logger.info('User Registered', {
            newUserId: newUser.id,
            newUsername: newUser.username,
            newUserRole: newUser.role,
            registeredBy: req.user.id,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        logger.error('Registration Error', {
            error: error.message,
            stack: error.stack,
            registeredBy: req.user?.id,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({
            error: 'Internal server error',
            message: 'Registration failed'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    logger.security.dataAccess({
        userId: req.user.id,
        action: 'profile_access',
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
});

// Logout endpoint (for logging purposes)
router.post('/logout', authenticateToken, (req, res) => {
    logger.info('User Logout', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
