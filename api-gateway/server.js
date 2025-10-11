const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const {
    monitoringMiddleware,
    getMetrics,
    getMetricsJSON,
    getHealthStatus
} = require('./middleware/monitoring');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://zra.gov.zm'] : true,
    credentials: true
}));

// Rate limiting (increased for testing - adjust for production)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs (testing mode)
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Monitoring middleware
app.use(monitoringMiddleware);

// Request logging
app.use((req, res, next) => {
    logger.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// Health check with detailed metrics
app.get('/health', async (req, res) => {
    const health = await getHealthStatus();
    res.json({
        status: 'healthy',
        service: 'TaxGuard API Gateway',
        version: '1.0.0',
        ...health
    });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(await getMetrics());
});

// JSON metrics for custom dashboards
app.get('/metrics/json', async (req, res) => {
    res.json(await getMetricsJSON());
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);

// Reports endpoint with minimal validation (security disabled for testing)
app.post('/api/reports', async (req, res) => {
    try {
        logger.info('Report Submission', {
            body: req.body,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Simple validation - accept any valid JSON
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Request body must be valid JSON'
            });
        }

        // For testing - just return success
        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            reportId: 'TEST-' + Date.now(),
            data: req.body,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Report Submission Error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: 'Report submission failed',
            message: 'Unable to process report'
        });
    }
});

// Simple API Links Page
app.get('/apis', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>TaxGuard API Links</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .api-link { display: block; padding: 15px; margin: 10px 0; background: #f8f9fa; border: 1px solid #ddd; text-decoration: none; color: #333; border-radius: 5px; }
        .api-link:hover { background: #e9ecef; }
        .working { border-left: 5px solid #28a745; }
        .waiting { border-left: 5px solid #ffc107; background: #fff9e6; }
        .method { background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-right: 10px; }
        .method.GET { background: #28a745; }
        .method.POST { background: #dc3545; }
        .credentials { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .url { font-family: monospace; background: #f1f1f1; padding: 5px; border-radius: 3px; margin: 5px 0; word-break: break-all; }
        .demo-section { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 TaxGuard API Directory</h1>
            <p>Click links to test APIs directly</p>
        </div>

        <div class="demo-section">
            <h3>🎯 For Demo/Visitors</h3>
            <p><strong>Base URL:</strong> <span class="url">http://localhost:4000</span></p>
            <p><strong>Live Demo URLs:</strong></p>
            <ul>
                <li><strong>Health Check:</strong> <span class="url">http://localhost:4000/health</span></li>
                <li><strong>API Docs:</strong> <span class="url">http://localhost:4000/api-docs</span></li>
                <li><strong>This Directory:</strong> <span class="url">http://localhost:4000/apis</span></li>
            </ul>
        </div>

        <div class="credentials">
            <h3>🔐 Test Credentials</h3>
            <p><strong>Username:</strong> admin1</p>
            <p><strong>Password:</strong> password123</p>
            <p><strong>Other users:</strong> taxpayer1, auditor1 (same password)</p>
        </div>

        <div class="section">
            <h2>✅ Working APIs (Click to Test)</h2>
            
            <a href="/health" class="api-link working" target="_blank">
                <span class="method GET">GET</span>
                <strong>/health</strong> - Health check endpoint
                <div class="url">http://localhost:4000/health</div>
                <small>Returns server status and uptime</small>
            </a>

            <a href="/api-docs" class="api-link working" target="_blank">
                <span class="method GET">GET</span>
                <strong>/api-docs</strong> - API documentation
                <div class="url">http://localhost:4000/api-docs</div>
                <small>Returns complete API documentation</small>
            </a>

            <div class="api-link working">
                <span class="method POST">POST</span>
                <strong>/api/auth/login</strong> - User authentication
                <div class="url">http://localhost:4000/api/auth/login</div>
                <small>Use Postman/curl: {"username":"admin1","password":"password123"}</small>
            </div>

            <div class="api-link working">
                <span class="method GET">GET</span>
                <strong>/api/auth/profile</strong> - Get user profile
                <div class="url">http://localhost:4000/api/auth/profile</div>
                <small>Requires Authorization header with JWT token</small>
            </div>

            <div class="api-link working">
                <span class="method POST">POST</span>
                <strong>/api/events</strong> - Create blockchain event
                <div class="url">http://localhost:4000/api/events</div>
                <small>Requires JWT token and event JSON payload</small>
            </div>

            <div class="api-link working">
                <span class="method GET">GET</span>
                <strong>/api/events</strong> - List all events
                <div class="url">http://localhost:4000/api/events</div>
                <small>Requires JWT token for authentication</small>
            </div>
        </div>

        <div class="section">
            <h2>⏳ Waiting for Team Integration</h2>
            
            <div class="api-link waiting">
                <span class="method POST">POST</span>
                <strong>/api/ghostbuster/detection</strong> - GhostBuster API
                <div class="url">http://localhost:4000/api/ghostbuster/detection</div>
                <small>Ezra's phantom detection module - Not implemented yet</small>
            </div>

            <div class="api-link waiting">
                <span class="method POST">POST</span>
                <strong>/api/whistlepro/report</strong> - WhistlePro API
                <div class="url">http://localhost:4000/api/whistlepro/report</div>
                <small>Kelvin & Ephraim's whistleblower module - Not implemented yet</small>
            </div>

            <div class="api-link waiting">
                <span class="method POST">POST</span>
                <strong>/api/ai-risk/assessment</strong> - AI Risk API
                <div class="url">http://localhost:4000/api/ai-risk/assessment</div>
                <small>Shuan's AI risk scoring module - Not implemented yet</small>
            </div>

            <div class="api-link waiting">
                <span class="method POST">POST</span>
                <strong>/api/predictive/forecast</strong> - Predictive API
                <div class="url">http://localhost:4000/api/predictive/forecast</div>
                <small>Emmanuel's predictive analytics module - Not implemented yet</small>
            </div>

            <div class="api-link waiting">
                <span class="method GET">GET</span>
                <strong>/api/dashboard-feed/live</strong> - Dashboard API
                <div class="url">http://localhost:4000/api/dashboard-feed/live</div>
                <small>Thomas's dashboard integration - Not implemented yet</small>
            </div>
        </div>

        <div class="section">
            <h2>🧪 How to Test POST APIs</h2>
            <h3>Using curl:</h3>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
# 1. Login to get token
curl -X POST http://localhost:4000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin1","password":"password123"}'

# 2. Use token for protected endpoints
curl -X POST http://localhost:4000/api/events \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{"eventType":"filing","anonymizedUserId":"TPN-12345-ANON","hashOfPayload":"abc123","notes":"Test"}'
            </pre>

            <h3>Using Postman:</h3>
            <ol>
                <li>Set method to POST</li>
                <li>Add Content-Type: application/json header</li>
                <li>Add Authorization: Bearer TOKEN header (for protected endpoints)</li>
                <li>Add JSON body in raw format</li>
            </ol>

            <h3>🎯 Quick Demo URLs for Visitors:</h3>
            <ul>
                <li><strong>Health:</strong> <span class="url">http://localhost:4000/health</span></li>
                <li><strong>Docs:</strong> <span class="url">http://localhost:4000/api-docs</span></li>
                <li><strong>Directory:</strong> <span class="url">http://localhost:4000/apis</span></li>
            </ul>
        </div>
    </div>
</body>
</html>`);
});

// Working API Tester
app.get('/tester', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>TaxGuard API Tester</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .api-box { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
        .working { border-left: 5px solid #28a745; }
        .waiting { border-left: 5px solid #ffc107; background: #fff9e6; }
        button { background: #28a745; color: white; border: none; padding: 10px 15px; margin: 5px; cursor: pointer; }
        button:hover { background: #218838; }
        .result { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; white-space: pre-wrap; }
        .success { background: #d4edda; }
        .error { background: #f8d7da; }
        textarea { width: 100%; height: 60px; margin: 5px 0; }
        input { padding: 5px; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 TaxGuard API Tester</h1>
            <p>Click buttons to test APIs</p>
        </div>

        <div class="section">
            <h3>🔐 Authentication</h3>
            <input type="text" id="user" value="admin1">
            <input type="password" id="pass" value="password123">
            <button onclick="doLogin()">Login</button>
            <div id="auth-result"></div>
        </div>

        <div class="section">
            <h2>✅ Working APIs</h2>
            
            <div class="api-box working">
                <h4>Health Check</h4>
                <button onclick="callHealth()">Test /health</button>
                <div id="health-result" class="result"></div>
            </div>

            <div class="api-box working">
                <h4>Login API</h4>
                <textarea id="login-json">{"username":"admin1","password":"password123"}</textarea>
                <button onclick="callLogin()">Test /api/auth/login</button>
                <div id="login-result" class="result"></div>
            </div>

            <div class="api-box working">
                <h4>Profile API</h4>
                <button onclick="callProfile()">Test /api/auth/profile</button>
                <div id="profile-result" class="result"></div>
            </div>

            <div class="api-box working">
                <h4>Events API</h4>
                <textarea id="event-json">{"eventType":"filing","anonymizedUserId":"TPN-12345-ANON","hashOfPayload":"a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f","notes":"Test event"}</textarea>
                <button onclick="callEvent()">Test /api/events</button>
                <div id="event-result" class="result"></div>
            </div>
        </div>

        <div class="section">
            <h2>⏳ Waiting for Team Integration</h2>
            
            <div class="api-box waiting">
                <h4>GhostBuster API (Ezra)</h4>
                <p>POST /api/ghostbuster/detection - Waiting for Ezra's module</p>
            </div>

            <div class="api-box waiting">
                <h4>WhistlePro API (Kelvin/Ephraim)</h4>
                <p>POST /api/whistlepro/report - Waiting for Kelvin & Ephraim's module</p>
            </div>

            <div class="api-box waiting">
                <h4>AI Risk API (Shuan)</h4>
                <p>POST /api/ai-risk/assessment - Waiting for Shuan's module</p>
            </div>

            <div class="api-box waiting">
                <h4>Predictive API (Emmanuel)</h4>
                <p>POST /api/predictive/forecast - Waiting for Emmanuel's module</p>
            </div>

            <div class="api-box waiting">
                <h4>Dashboard API (Thomas)</h4>
                <p>GET /api/dashboard-feed/live - Waiting for Thomas's module</p>
            </div>
        </div>
    </div>

    <script>
        var authToken = '';

        function doLogin() {
            var username = document.getElementById('user').value;
            var password = document.getElementById('pass').value;
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: username, password: password})
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    authToken = data.token;
                    document.getElementById('auth-result').innerHTML = '<p style="color:green">✅ Logged in as: ' + data.user.username + '</p>';
                } else {
                    document.getElementById('auth-result').innerHTML = '<p style="color:red">❌ Login failed</p>';
                }
            })
            .catch(function(e) {
                document.getElementById('auth-result').innerHTML = '<p style="color:red">❌ Error: ' + e.message + '</p>';
            });
        }

        function callHealth() {
            fetch('/health')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                document.getElementById('health-result').className = 'result success';
                document.getElementById('health-result').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(e) {
                document.getElementById('health-result').className = 'result error';
                document.getElementById('health-result').textContent = 'Error: ' + e.message;
            });
        }

        function callLogin() {
            var body = document.getElementById('login-json').value;
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: body
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                document.getElementById('login-result').className = 'result success';
                document.getElementById('login-result').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(e) {
                document.getElementById('login-result').className = 'result error';
                document.getElementById('login-result').textContent = 'Error: ' + e.message;
            });
        }

        function callProfile() {
            if (!authToken) {
                alert('Please login first!');
                return;
            }
            
            fetch('/api/auth/profile', {
                headers: {'Authorization': 'Bearer ' + authToken}
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                document.getElementById('profile-result').className = 'result success';
                document.getElementById('profile-result').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(e) {
                document.getElementById('profile-result').className = 'result error';
                document.getElementById('profile-result').textContent = 'Error: ' + e.message;
            });
        }

        function callEvent() {
            if (!authToken) {
                alert('Please login first!');
                return;
            }
            
            var body = document.getElementById('event-json').value;
            
            fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: body
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                document.getElementById('event-result').className = 'result success';
                document.getElementById('event-result').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(e) {
                document.getElementById('event-result').className = 'result error';
                document.getElementById('event-result').textContent = 'Error: ' + e.message;
            });
        }

        // Auto-login when page loads
        window.onload = function() {
            doLogin();
        };
    </script>
</body>
</html>`);
});

// Minimal Test Page
app.get('/debug', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Debug Test</title>
</head>
<body>
    <h1>JavaScript Debug Test</h1>
    <button onclick="testClick()">Click Me</button>
    <div id="result"></div>
    
    <script>
        function testClick() {
            document.getElementById('result').innerHTML = 'JavaScript is working!';
            alert('Button clicked!');
        }
        
        console.log('JavaScript loaded');
    </script>
</body>
</html>`);
});

// Simple Working API Tester
app.get('/test', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>TaxGuard API Tester</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
        .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .api-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .working { border-left: 4px solid #28a745; }
        .waiting { border-left: 4px solid #ffc107; background: #fff9e6; }
        .btn { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .response { background: #f1f1f1; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
        .success { background: #d4edda; }
        .error { background: #f8d7da; }
        textarea { width: 100%; height: 60px; margin: 5px 0; }
        input { padding: 5px; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 TaxGuard API Tester</h1>
        </div>

        <div class="section">
            <h3>🔐 Authentication</h3>
            <input type="text" id="username" value="admin1" placeholder="Username">
            <input type="password" id="password" value="password123" placeholder="Password">
            <button class="btn" onclick="login()">Login</button>
            <div id="auth-status"></div>
        </div>

        <div class="section">
            <h2>✅ Working APIs</h2>
            
            <div class="api-item working">
                <h4>GET /health</h4>
                <button class="btn" onclick="testHealth()">Test Health</button>
                <div id="health-response" class="response"></div>
            </div>

            <div class="api-item working">
                <h4>POST /api/auth/login</h4>
                <textarea id="login-body">{"username":"admin1","password":"password123"}</textarea>
                <button class="btn" onclick="testLoginAPI()">Test Login API</button>
                <div id="login-response" class="response"></div>
            </div>

            <div class="api-item working">
                <h4>GET /api/auth/profile</h4>
                <button class="btn" onclick="testProfile()">Test Profile</button>
                <div id="profile-response" class="response"></div>
            </div>

            <div class="api-item working">
                <h4>POST /api/events</h4>
                <textarea id="event-body">{"eventType":"filing","anonymizedUserId":"TPN-12345-ANON","hashOfPayload":"a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f","notes":"Test event"}</textarea>
                <button class="btn" onclick="testEvent()">Test Create Event</button>
                <div id="event-response" class="response"></div>
            </div>
        </div>

        <div class="section">
            <h2>⏳ Waiting for Team Integration</h2>
            
            <div class="api-item waiting">
                <h4>POST /api/ghostbuster/detection</h4>
                <p>Waiting for Ezra to complete GhostBuster module</p>
            </div>

            <div class="api-item waiting">
                <h4>POST /api/whistlepro/report</h4>
                <p>Waiting for Kelvin & Ephraim to complete WhistlePro module</p>
            </div>

            <div class="api-item waiting">
                <h4>POST /api/ai-risk/assessment</h4>
                <p>Waiting for Shuan to complete AI Risk module</p>
            </div>

            <div class="api-item waiting">
                <h4>POST /api/predictive/forecast</h4>
                <p>Waiting for Emmanuel to complete Predictive module</p>
            </div>

            <div class="api-item waiting">
                <h4>GET /api/dashboard-feed/live</h4>
                <p>Waiting for Thomas to complete Dashboard module</p>
            </div>
        </div>
    </div>

    <script>
        var token = '';

        function login() {
            var username = document.getElementById('username').value;
            var password = document.getElementById('password').value;
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    token = data.token;
                    document.getElementById('auth-status').innerHTML = '<p style="color: green;">✅ Logged in as: ' + data.user.username + '</p>';
                } else {
                    document.getElementById('auth-status').innerHTML = '<p style="color: red;">❌ Login failed</p>';
                }
            })
            .catch(function(error) {
                document.getElementById('auth-status').innerHTML = '<p style="color: red;">❌ Error: ' + error.message + '</p>';
            });
        }

        function testHealth() {
            fetch('/health')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                document.getElementById('health-response').className = 'response success';
                document.getElementById('health-response').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(error) {
                document.getElementById('health-response').className = 'response error';
                document.getElementById('health-response').textContent = 'Error: ' + error.message;
            });
        }

        function testLoginAPI() {
            var body = document.getElementById('login-body').value;
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                document.getElementById('login-response').className = 'response success';
                document.getElementById('login-response').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(error) {
                document.getElementById('login-response').className = 'response error';
                document.getElementById('login-response').textContent = 'Error: ' + error.message;
            });
        }

        function testProfile() {
            if (!token) {
                alert('Please login first!');
                return;
            }
            
            fetch('/api/auth/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                document.getElementById('profile-response').className = 'response success';
                document.getElementById('profile-response').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(error) {
                document.getElementById('profile-response').className = 'response error';
                document.getElementById('profile-response').textContent = 'Error: ' + error.message;
            });
        }

        function testEvent() {
            if (!token) {
                alert('Please login first!');
                return;
            }
            
            var body = document.getElementById('event-body').value;
            
            fetch('/api/events', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token 
                },
                body: body
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                document.getElementById('event-response').className = 'response success';
                document.getElementById('event-response').textContent = JSON.stringify(data, null, 2);
            })
            .catch(function(error) {
                document.getElementById('event-response').className = 'response error';
                document.getElementById('event-response').textContent = 'Error: ' + error.message;
            });
        }

        // Auto-login when page loads
        window.onload = function() {
            login();
        };
    </script>
</body>
</html>`);
});

// API Tester Page
app.get('/api-tester.html', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaxGuard API Tester</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        
        .section { background: white; border-radius: 10px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee; }
        
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .api-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; transition: all 0.3s; cursor: pointer; }
        .api-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .api-card.working { border-left: 4px solid #28a745; }
        .api-card.waiting { border-left: 4px solid #ffc107; background: #fff9e6; }
        
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; margin-right: 10px; }
        .method.GET { background: #28a745; color: white; }
        .method.POST { background: #007bff; color: white; }
        
        .endpoint { font-family: monospace; font-size: 0.9em; color: #666; margin: 5px 0; }
        .description { font-size: 0.9em; color: #777; margin-top: 8px; }
        
        .test-panel { display: none; background: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 15px; }
        .test-panel.active { display: block; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .form-group textarea { height: 100px; font-family: monospace; }
        
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn:hover { opacity: 0.9; }
        
        .response { margin-top: 15px; padding: 15px; background: #f1f1f1; border-radius: 4px; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .response.success { background: #d4edda; border: 1px solid #c3e6cb; }
        .response.error { background: #f8d7da; border: 1px solid #f5c6cb; }
        
        .status { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
        .status.working { background: #28a745; color: white; }
        .status.waiting { background: #ffc107; color: black; }
        
        .auth-section { background: #e3f2fd; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .token-display { font-family: monospace; font-size: 0.8em; background: white; padding: 10px; border-radius: 4px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 TaxGuard API Tester</h1>
            <p>Test all blockchain APIs from one dashboard</p>
        </div>

        <div class="auth-section">
            <h3>🔐 Authentication</h3>
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <input type="text" id="username" placeholder="Username" value="admin1">
                <input type="password" id="password" placeholder="Password" value="password123">
                <button class="btn btn-primary" onclick="login()">Login</button>
            </div>
            <div id="token-display" class="token-display" style="display: none;"></div>
        </div>

        <div class="section">
            <h2>✅ Working APIs</h2>
            <div class="api-grid">
                <div class="api-card working" onclick="toggleTest('health')">
                    <span class="method GET">GET</span>
                    <div class="endpoint">/health</div>
                    <div class="description">Health check endpoint</div>
                    <span class="status working">WORKING</span>
                </div>

                <div class="api-card working" onclick="toggleTest('login')">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/auth/login</div>
                    <div class="description">User authentication</div>
                    <span class="status working">WORKING</span>
                </div>

                <div class="api-card working" onclick="toggleTest('profile')">
                    <span class="method GET">GET</span>
                    <div class="endpoint">/api/auth/profile</div>
                    <div class="description">Get user profile (requires token)</div>
                    <span class="status working">WORKING</span>
                </div>

                <div class="api-card working" onclick="toggleTest('events-create')">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/events</div>
                    <div class="description">Create blockchain event</div>
                    <span class="status working">WORKING</span>
                </div>

                <div class="api-card working" onclick="toggleTest('events-list')">
                    <span class="method GET">GET</span>
                    <div class="endpoint">/api/events</div>
                    <div class="description">List all events</div>
                    <span class="status working">WORKING</span>
                </div>

                <div class="api-card working" onclick="toggleTest('api-docs')">
                    <span class="method GET">GET</span>
                    <div class="endpoint">/api-docs</div>
                    <div class="description">API documentation</div>
                    <span class="status working">WORKING</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>⏳ Waiting for Team Integration</h2>
            <div class="api-grid">
                <div class="api-card waiting">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/ghostbuster/detection</div>
                    <div class="description">GhostBuster phantom detection (Ezra)</div>
                    <span class="status waiting">WAITING</span>
                </div>

                <div class="api-card waiting">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/whistlepro/report</div>
                    <div class="description">WhistlePro anonymous reports (Kelvin/Ephraim)</div>
                    <span class="status waiting">WAITING</span>
                </div>

                <div class="api-card waiting">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/ai-risk/assessment</div>
                    <div class="description">AI Risk scoring (Shuan)</div>
                    <span class="status waiting">WAITING</span>
                </div>

                <div class="api-card waiting">
                    <span class="method POST">POST</span>
                    <div class="endpoint">/api/predictive/forecast</div>
                    <div class="description">Predictive analytics (Emmanuel)</div>
                    <span class="status waiting">WAITING</span>
                </div>

                <div class="api-card waiting">
                    <span class="method GET">GET</span>
                    <div class="endpoint">/api/dashboard-feed/live</div>
                    <div class="description">Dashboard feed (Thomas)</div>
                    <span class="status waiting">WAITING</span>
                </div>
            </div>
        </div>

        <!-- Test Panels -->
        <div id="test-health" class="test-panel">
            <h3>Test Health Check</h3>
            <button class="btn btn-success" onclick="testAPI('GET', '/health', 'health')">Test Health</button>
            <div id="response-health" class="response"></div>
        </div>

        <div id="test-login" class="test-panel">
            <h3>Test Login</h3>
            <div class="form-group">
                <label>Request Body:</label>
                <textarea id="login-body">{"username":"admin1","password":"password123"}</textarea>
            </div>
            <button class="btn btn-success" onclick="testLogin()">Test Login</button>
            <div id="response-login" class="response"></div>
        </div>

        <div id="test-profile" class="test-panel">
            <h3>Test Profile</h3>
            <p>Requires authentication token</p>
            <button class="btn btn-success" onclick="testAPI('GET', '/api/auth/profile', 'profile', true)">Test Profile</button>
            <div id="response-profile" class="response"></div>
        </div>

        <div id="test-events-create" class="test-panel">
            <h3>Test Create Event</h3>
            <div class="form-group">
                <label>Request Body:</label>
                <textarea id="event-body">{"eventType":"filing","anonymizedUserId":"TPN-12345-ANON","hashOfPayload":"a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f","notes":"Test event"}</textarea>
            </div>
            <button class="btn btn-success" onclick="testCreateEvent()">Test Create Event</button>
            <div id="response-events-create" class="response"></div>
        </div>

        <div id="test-events-list" class="test-panel">
            <h3>Test List Events</h3>
            <button class="btn btn-success" onclick="testAPI('GET', '/api/events', 'events-list', true)">Test List Events</button>
            <div id="response-events-list" class="response"></div>
        </div>

        <div id="test-api-docs" class="test-panel">
            <h3>Test API Docs</h3>
            <button class="btn btn-success" onclick="testAPI('GET', '/api-docs', 'api-docs')">Test API Docs</button>
            <div id="response-api-docs" class="response"></div>
        </div>
    </div>

    <script>
        let authToken = '';

        function toggleTest(testId) {
            document.querySelectorAll('.test-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            const panel = document.getElementById('test-' + testId);
            if (panel) {
                panel.classList.add('active');
                panel.scrollIntoView({ behavior: 'smooth' });
            }
        }

        async function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    document.getElementById('token-display').style.display = 'block';
                    document.getElementById('token-display').textContent = 'Token: ' + authToken.substring(0, 50) + '...';
                    alert('✅ Login successful!');
                } else {
                    alert('❌ Login failed: ' + data.message);
                }
            } catch (error) {
                alert('❌ Login error: ' + error.message);
            }
        }

        async function testAPI(method, endpoint, responseId, requiresAuth = false) {
            const responseEl = document.getElementById('response-' + responseId);
            
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (requiresAuth && authToken) {
                    headers['Authorization'] = 'Bearer ' + authToken;
                }
                
                const options = { method, headers };
                
                const response = await fetch(endpoint, options);
                const data = await response.json();
                
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
                
            } catch (error) {
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testLogin() {
            const body = document.getElementById('login-body').value;
            const responseEl = document.getElementById('response-login');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body
                });
                
                const data = await response.json();
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
                
            } catch (error) {
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testCreateEvent() {
            const body = document.getElementById('event-body').value;
            const responseEl = document.getElementById('response-events-create');
            
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
                
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: headers,
                    body: body
                });
                
                const data = await response.json();
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
                
            } catch (error) {
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        // Auto-login on page load
        window.onload = function() {
            login();
        };
    </script>
</body>
</html>`);
});

// API documentation
app.get('/api-docs', (req, res) => {
    res.json({
        title: 'TaxGuard API Gateway',
        version: '1.0.0',
        description: 'Secure API Gateway for TaxGuard Blockchain System',
        endpoints: {
            'POST /api/auth/login': 'Authenticate user and get JWT token',
            'POST /api/auth/register': 'Register new user (admin only)',
            'POST /api/events': 'Submit new tax event (authenticated)',
            'GET /api/events/:id': 'Retrieve tax event by ID (auditor+)',
            'GET /api/events': 'List all events (auditor+)',
            'GET /health': 'Health check endpoint',
            'GET /api-docs': 'This documentation',
            'GET /api-tester.html': 'Interactive API testing dashboard'
        },
        authentication: 'JWT Bearer Token required for protected endpoints',
        roles: ['taxpayer', 'auditor', 'admin']
    });
});

// 404 handler
app.use('*', (req, res) => {
    logger.warn('404 Not Found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested resource does not exist',
        availableEndpoints: ['/health', '/api-docs', '/api/auth/login', '/api/events']
    });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info('Server Started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
    console.log(`🚀 TaxGuard API Gateway running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
