const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working!' });
});

// Simple login for testing (replace with secure version in production)
router.post('/login', async (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    try {
        const { username, password } = req.body;
        
        // Simple user validation for demo
        const testUsers = {
            'admin': { id: 1, name: 'Administrator', role: 'admin', password: 'admin123' },
            'auditor': { id: 2, name: 'Tax Auditor', role: 'auditor', password: 'auditor123' },
            'analyst': { id: 3, name: 'Data Analyst', role: 'analyst', password: 'analyst123' }
        };
        
        console.log('👤 Looking for user:', username);
        const user = testUsers[username];
        
        if (!user || user.password !== password) {
            console.log('❌ Login failed for:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        console.log('✅ Login successful for:', username);
        // Generate simple token (use JWT in production)
        const token = Buffer.from(`${user.id}:${username}:${Date.now()}`).toString('base64');
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username,
                name: user.name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

module.exports = router;
