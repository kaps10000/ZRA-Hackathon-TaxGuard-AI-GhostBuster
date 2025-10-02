// Add route for simple API tester
app.get('/test', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>TaxGuard API Tester</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .api-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; cursor: pointer; }
        .api-item:hover { background: #f8f9fa; }
        .working { border-left: 4px solid #28a745; }
        .waiting { border-left: 4px solid #ffc107; background: #fff9e6; }
        .method { background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
        .method.GET { background: #28a745; }
        .method.POST { background: #007bff; }
        .test-area { display: none; background: #f8f9fa; padding: 15px; margin-top: 10px; border-radius: 5px; }
        .btn { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #218838; }
        textarea { width: 100%; height: 80px; margin: 10px 0; font-family: monospace; }
        .response { background: #f1f1f1; padding: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin-top: 10px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; }
        .auth-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 TaxGuard API Tester</h1>
            <p>Interactive API Testing Dashboard</p>
        </div>

        <div class="auth-box">
            <h3>🔐 Authentication</h3>
            <input type="text" id="username" placeholder="Username" value="admin1">
            <input type="password" id="password" placeholder="Password" value="password123">
            <button class="btn" onclick="doLogin()">Login</button>
            <div id="token-info" style="margin-top: 10px; font-family: monospace; font-size: 0.8em;"></div>
        </div>

        <div class="section">
            <h2>✅ Working APIs</h2>
            
            <div class="api-item working" onclick="toggleTest('health')">
                <span class="method GET">GET</span> <strong>/health</strong> - Health check
                <div id="test-health" class="test-area">
                    <button class="btn" onclick="testHealth()">Test Health</button>
                    <div id="response-health" class="response"></div>
                </div>
            </div>

            <div class="api-item working" onclick="toggleTest('login')">
                <span class="method POST">POST</span> <strong>/api/auth/login</strong> - User login
                <div id="test-login" class="test-area">
                    <textarea id="login-body">{"username":"admin1","password":"password123"}</textarea>
                    <button class="btn" onclick="testLogin()">Test Login</button>
                    <div id="response-login" class="response"></div>
                </div>
            </div>

            <div class="api-item working" onclick="toggleTest('profile')">
                <span class="method GET">GET</span> <strong>/api/auth/profile</strong> - Get profile (needs token)
                <div id="test-profile" class="test-area">
                    <button class="btn" onclick="testProfile()">Test Profile</button>
                    <div id="response-profile" class="response"></div>
                </div>
            </div>

            <div class="api-item working" onclick="toggleTest('events')">
                <span class="method POST">POST</span> <strong>/api/events</strong> - Create event (needs token)
                <div id="test-events" class="test-area">
                    <textarea id="events-body">{"eventType":"filing","anonymizedUserId":"TPN-12345-ANON","hashOfPayload":"a3f7e92b1c4d8e6f5a9b2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f","notes":"Test event"}</textarea>
                    <button class="btn" onclick="testEvents()">Test Create Event</button>
                    <div id="response-events" class="response"></div>
                </div>
            </div>

            <div class="api-item working" onclick="toggleTest('docs')">
                <span class="method GET">GET</span> <strong>/api-docs</strong> - API documentation
                <div id="test-docs" class="test-area">
                    <button class="btn" onclick="testDocs()">Test API Docs</button>
                    <div id="response-docs" class="response"></div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>⏳ Waiting for Team Integration</h2>
            
            <div class="api-item waiting">
                <span class="method POST">POST</span> <strong>/api/ghostbuster/detection</strong> - GhostBuster (Ezra)
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Waiting for Ezra to complete phantom detection module</p>
            </div>

            <div class="api-item waiting">
                <span class="method POST">POST</span> <strong>/api/whistlepro/report</strong> - WhistlePro (Kelvin/Ephraim)
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Waiting for Kelvin & Ephraim to complete whistleblower module</p>
            </div>

            <div class="api-item waiting">
                <span class="method POST">POST</span> <strong>/api/ai-risk/assessment</strong> - AI Risk (Shuan)
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Waiting for Shuan to complete AI risk scoring module</p>
            </div>

            <div class="api-item waiting">
                <span class="method POST">POST</span> <strong>/api/predictive/forecast</strong> - Predictive (Emmanuel)
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Waiting for Emmanuel to complete predictive analytics module</p>
            </div>

            <div class="api-item waiting">
                <span class="method GET">GET</span> <strong>/api/dashboard-feed/live</strong> - Dashboard (Thomas)
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Waiting for Thomas to complete dashboard integration</p>
            </div>
        </div>
    </div>

    <script>
        let token = '';

        function toggleTest(testId) {
            const testArea = document.getElementById('test-' + testId);
            const isVisible = testArea.style.display === 'block';
            
            // Hide all test areas
            document.querySelectorAll('.test-area').forEach(area => {
                area.style.display = 'none';
            });
            
            // Show/hide the clicked one
            testArea.style.display = isVisible ? 'none' : 'block';
        }

        async function doLogin() {
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
                    token = data.token;
                    document.getElementById('token-info').innerHTML = '✅ Logged in as: ' + data.user.username + ' (' + data.user.role + ')';
                } else {
                    document.getElementById('token-info').innerHTML = '❌ Login failed: ' + data.message;
                }
            } catch (error) {
                document.getElementById('token-info').innerHTML = '❌ Error: ' + error.message;
            }
        }

        async function testHealth() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                
                const responseEl = document.getElementById('response-health');
                responseEl.className = 'response success';
                responseEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const responseEl = document.getElementById('response-health');
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testLogin() {
            const body = document.getElementById('login-body').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body
                });
                
                const data = await response.json();
                
                const responseEl = document.getElementById('response-login');
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const responseEl = document.getElementById('response-login');
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testProfile() {
            if (!token) {
                alert('Please login first!');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                const data = await response.json();
                
                const responseEl = document.getElementById('response-profile');
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const responseEl = document.getElementById('response-profile');
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testEvents() {
            if (!token) {
                alert('Please login first!');
                return;
            }
            
            const body = document.getElementById('events-body').value;
            
            try {
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token 
                    },
                    body: body
                });
                
                const data = await response.json();
                
                const responseEl = document.getElementById('response-events');
                responseEl.className = 'response ' + (response.ok ? 'success' : 'error');
                responseEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const responseEl = document.getElementById('response-events');
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        async function testDocs() {
            try {
                const response = await fetch('/api-docs');
                const data = await response.json();
                
                const responseEl = document.getElementById('response-docs');
                responseEl.className = 'response success';
                responseEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const responseEl = document.getElementById('response-docs');
                responseEl.className = 'response error';
                responseEl.textContent = 'Error: ' + error.message;
            }
        }

        // Auto-login on page load
        window.onload = function() {
            doLogin();
        };
    </script>
</body>
</html>`);
});
