# WhistlePro Real-Time Client Integration Guide

Complete guide for integrating WhistlePro's real-time features into your mobile app or web frontend.

---

## Table of Contents
1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Authentication](#authentication)
4. [Listening for Events](#listening-for-events)
5. [React Integration](#react-integration)
6. [React Native Integration](#react-native-integration)
7. [Vue.js Integration](#vuejs-integration)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Installation

### For Web Applications (React, Vue, Angular)
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### For React Native
```bash
npm install socket.io-client react-native-get-random-values
# or
yarn add socket.io-client react-native-get-random-values
```

---

## Basic Setup

### Vanilla JavaScript

```javascript
import io from 'socket.io-client';

// Connect to WhistlePro backend
const socket = io('http://localhost:3005', {
  transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
  reconnection: true,                    // Enable auto-reconnection
  reconnectionAttempts: 5,              // Try 5 times
  reconnectionDelay: 1000,              // Wait 1s between attempts
});

// Connection successful
socket.on('connect', () => {
  console.log('✓ Connected to WhistlePro:', socket.id);
});

// Receive welcome message
socket.on('connected', (data) => {
  console.log('Welcome:', data.message);
  console.log('Your role:', data.user.role);
  console.log('Available events:', data.availableEvents);
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## Authentication

### For Authenticated Users (Investigators)

```javascript
// Get JWT token from your auth system
const token = localStorage.getItem('authToken'); // or from your auth provider

const socket = io('http://localhost:3005', {
  auth: {
    token: token  // Send JWT token for authentication
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
});

socket.on('connected', (data) => {
  if (data.user.isAuthenticated) {
    console.log(`✓ Authenticated as: ${data.user.username} (${data.user.role})`);
    // User will receive real-time notifications
  } else {
    console.log('Connected as anonymous user');
  }
});
```

### For Anonymous Users (Public Reporters)

```javascript
// No token needed for public reporters
const socket = io('http://localhost:3005', {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

// Anonymous users can submit reports but won't receive investigation updates
```

---

## Listening for Events

### Available Events

| Event | Who Receives | Description |
|-------|--------------|-------------|
| `newReport` | Authenticated only | New anonymous report submitted |
| `reportUpdated` | Authenticated only | Report details changed |
| `statusChanged` | Authenticated only | Report status updated |
| `reportAssigned` | Authenticated only | Case assigned to investigator |
| `newComment` | Authenticated only | New comment added to case |
| `reportDeleted` | Authenticated only | Report deleted |
| `systemAlert` | Everyone | System-wide announcements |

### Example: Listen for New Reports

```javascript
socket.on('newReport', (data) => {
  console.log('📢 New Report!', data);

  // Show notification to user
  showNotification({
    title: 'New Whistleblower Report',
    body: `${data.report.caseId}: ${data.report.title}`,
    priority: data.report.priority
  });

  // Update UI
  addReportToList(data.report);
});
```

### Example: Listen for Status Changes

```javascript
socket.on('statusChanged', (data) => {
  console.log(`Status updated: ${data.caseId}`);
  console.log(`${data.oldStatus} → ${data.newStatus}`);

  // Update the specific report in your UI
  updateReportStatus(data.caseId, data.newStatus);
});
```

### Example: System Alerts

```javascript
socket.on('systemAlert', (data) => {
  const alertStyles = {
    'info': 'blue',
    'warning': 'yellow',
    'error': 'red',
    'critical': 'red-flashing'
  };

  showAlert({
    message: data.message,
    level: data.level,
    style: alertStyles[data.level]
  });
});
```

---

## React Integration

### Create a Socket Hook

```javascript
// hooks/useWhistleProSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useWhistleProSocket = (token = null) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [newReports, setNewReports] = useState([]);

  useEffect(() => {
    const socketInstance = io('http://localhost:3005', {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketInstance.on('connect', () => {
      console.log('✓ Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('✗ Disconnected');
      setConnected(false);
    });

    socketInstance.on('newReport', (data) => {
      setNewReports(prev => [data.report, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, connected, newReports };
};
```

### Use in Component

```javascript
// components/InvestigatorDashboard.jsx
import React from 'react';
import { useWhistleProSocket } from '../hooks/useWhistleProSocket';

const InvestigatorDashboard = () => {
  const token = localStorage.getItem('authToken');
  const { socket, connected, newReports } = useWhistleProSocket(token);

  useEffect(() => {
    if (!socket) return;

    // Listen for status changes
    socket.on('statusChanged', (data) => {
      console.log('Status changed:', data);
      // Update your state
    });

    return () => {
      socket.off('statusChanged');
    };
  }, [socket]);

  return (
    <div>
      <h1>Investigator Dashboard</h1>
      <div className={connected ? 'status-online' : 'status-offline'}>
        {connected ? '🟢 Real-time Updates Active' : '🔴 Offline'}
      </div>

      <h2>Recent Reports</h2>
      {newReports.map(report => (
        <div key={report.caseId} className="report-card">
          <h3>{report.title}</h3>
          <span className={`priority-${report.priority.toLowerCase()}`}>
            {report.priority}
          </span>
          <p>{report.category}</p>
        </div>
      ))}
    </div>
  );
};

export default InvestigatorDashboard;
```

### Show Real-Time Notifications

```javascript
// components/RealtimeNotifications.jsx
import React, { useEffect } from 'react';
import { toast } from 'react-toastify'; // or your notification library

const RealtimeNotifications = ({ socket }) => {
  useEffect(() => {
    if (!socket) return;

    socket.on('newReport', (data) => {
      toast.info(
        `New Report: ${data.report.caseId}`,
        {
          position: 'top-right',
          autoClose: 5000,
          onClick: () => navigateToReport(data.report.caseId)
        }
      );
    });

    socket.on('statusChanged', (data) => {
      toast.success(`${data.caseId} status updated to ${data.newStatus}`);
    });

    return () => {
      socket.off('newReport');
      socket.off('statusChanged');
    };
  }, [socket]);

  return null; // This component doesn't render anything
};

export default RealtimeNotifications;
```

---

## React Native Integration

### Setup

```javascript
// services/socketService.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  socket = null;
  listeners = {};

  async connect() {
    const token = await AsyncStorage.getItem('authToken');

    this.socket = io('http://192.168.1.100:3005', { // Use your server IP
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('✓ Connected to WhistlePro');
    });

    this.socket.on('disconnect', () => {
      console.log('✗ Disconnected from WhistlePro');
    });

    this.socket.on('newReport', (data) => {
      this.notifyListeners('newReport', data);
    });

    this.socket.on('statusChanged', (data) => {
      this.notifyListeners('statusChanged', data);
    });
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
```

### Use in React Native Component

```javascript
// screens/InvestigatorDashboard.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import PushNotification from 'react-native-push-notification';
import socketService from '../services/socketService';

const InvestigatorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Listen for connection status
    socketService.socket.on('connect', () => setConnected(true));
    socketService.socket.on('disconnect', () => setConnected(false));

    // Listen for new reports
    const handleNewReport = (data) => {
      setReports(prev => [data.report, ...prev]);

      // Show push notification
      PushNotification.localNotification({
        title: 'New Whistleblower Report',
        message: `${data.report.caseId}: ${data.report.title}`,
        priority: data.report.priority === 'Critical' ? 'high' : 'default',
      });
    };

    socketService.on('newReport', handleNewReport);

    return () => {
      socketService.off('newReport', handleNewReport);
      socketService.disconnect();
    };
  }, []);

  return (
    <View>
      <Text style={{ color: connected ? 'green' : 'red' }}>
        {connected ? '🟢 Live' : '🔴 Offline'}
      </Text>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.caseId}
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <Text style={styles.caseId}>{item.caseId}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.priority}>{item.priority}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default InvestigatorDashboard;
```

---

## Vue.js Integration

### Create a Plugin

```javascript
// plugins/socketPlugin.js
import io from 'socket.io-client';

export default {
  install(app, options) {
    const socket = io(options.url || 'http://localhost:3005', {
      auth: options.token ? { token: options.token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Make socket available globally
    app.config.globalProperties.$socket = socket;

    // Provide socket for composition API
    app.provide('socket', socket);
  }
};
```

### Use in Vue Component

```vue
<!-- components/InvestigatorDashboard.vue -->
<template>
  <div>
    <h1>Investigator Dashboard</h1>
    <div :class="connected ? 'online' : 'offline'">
      {{ connected ? '🟢 Live' : '🔴 Offline' }}
    </div>

    <div v-for="report in reports" :key="report.caseId" class="report-card">
      <h3>{{ report.title }}</h3>
      <span :class="`priority-${report.priority.toLowerCase()}`">
        {{ report.priority }}
      </span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject } from 'vue';

export default {
  name: 'InvestigatorDashboard',
  setup() {
    const socket = inject('socket');
    const connected = ref(false);
    const reports = ref([]);

    const handleNewReport = (data) => {
      reports.value.unshift(data.report);
      // Show notification
      new Notification('New Report', {
        body: `${data.report.caseId}: ${data.report.title}`
      });
    };

    onMounted(() => {
      socket.on('connect', () => connected.value = true);
      socket.on('disconnect', () => connected.value = false);
      socket.on('newReport', handleNewReport);
    });

    onUnmounted(() => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newReport', handleNewReport);
    });

    return { connected, reports };
  }
};
</script>
```

---

## Error Handling

### Handle Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);

  if (error.message.includes('jwt')) {
    // Token expired or invalid
    console.log('Authentication failed, refreshing token...');
    refreshAuthToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  } else {
    // Network error
    showMessage('Cannot connect to server. Check your internet connection.');
  }
});
```

### Handle Reconnection

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log(`✓ Reconnected after ${attemptNumber} attempts`);
  showMessage('Connection restored!', 'success');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}...`);
  showMessage(`Reconnecting... (attempt ${attemptNumber})`, 'info');
});

socket.on('reconnect_failed', () => {
  console.error('✗ Reconnection failed');
  showMessage('Could not reconnect. Please refresh the page.', 'error');
});
```

### Handle Server Shutdown

```javascript
socket.on('serverShutdown', (data) => {
  console.log('Server is restarting:', data.message);

  showMessage(
    'Server maintenance in progress. You will be reconnected automatically.',
    'warning'
  );

  // Socket.io will auto-reconnect when server comes back online
});
```

---

## Best Practices

### 1. **Clean Up Event Listeners**

```javascript
// ❌ BAD: Memory leak
useEffect(() => {
  socket.on('newReport', handleNewReport);
}, []); // Listener never removed!

// ✅ GOOD: Properly cleaned up
useEffect(() => {
  socket.on('newReport', handleNewReport);

  return () => {
    socket.off('newReport', handleNewReport);
  };
}, []);
```

### 2. **Use Connection Pooling**

```javascript
// ❌ BAD: Creating multiple sockets
const socket1 = io('http://localhost:3005');
const socket2 = io('http://localhost:3005'); // Unnecessary!

// ✅ GOOD: Single socket instance
const socket = io('http://localhost:3005');
// Share this socket across your app
```

### 3. **Implement Heartbeat**

```javascript
// Send periodic pings to keep connection alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping', (response) => {
      console.log('Ping:', response.pong ? 'OK' : 'Failed');
    });
  }
}, 30000); // Every 30 seconds
```

### 4. **Handle Token Refresh**

```javascript
// Refresh token before it expires
const setupTokenRefresh = (socket, expiresIn) => {
  setTimeout(() => {
    refreshAuthToken().then(newToken => {
      // Update socket authentication
      socket.auth.token = newToken;
      // Reconnect with new token
      socket.disconnect().connect();
    });
  }, (expiresIn - 60) * 1000); // Refresh 1 minute before expiry
};
```

### 5. **Offline Support**

```javascript
const messageQueue = [];

socket.on('disconnect', () => {
  // Queue messages while offline
  queueMode = true;
});

socket.on('connect', () => {
  // Send queued messages
  messageQueue.forEach(msg => socket.emit(msg.event, msg.data));
  messageQueue.length = 0;
  queueMode = false;
});
```

---

## Troubleshooting

### Issue 1: "Cannot connect to server"

**Solution:**
```javascript
// Check if server is running
fetch('http://localhost:3005/health')
  .then(res => res.json())
  .then(data => console.log('Server status:', data))
  .catch(err => console.error('Server offline:', err));

// Check CORS settings match
const socket = io('http://localhost:3005', {
  withCredentials: true, // If using credentials
});
```

### Issue 2: "Authentication failed"

**Solution:**
```javascript
// Verify token is valid
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'Present' : 'Missing');

// Check token expiry
const decoded = jwt_decode(token);
console.log('Token expires:', new Date(decoded.exp * 1000));

// Reconnect with new token
socket.auth.token = newToken;
socket.disconnect().connect();
```

### Issue 3: "Not receiving events"

**Solution:**
```javascript
// Check user authentication status
socket.on('connected', (data) => {
  console.log('Authenticated:', data.user.isAuthenticated);
  console.log('Role:', data.user.role);

  if (!data.user.isAuthenticated) {
    console.warn('You must be authenticated to receive real-time updates');
  }
});

// Verify event listeners are attached
console.log('Listeners:', socket.listeners('newReport'));
```

### Issue 4: "High memory usage"

**Solution:**
```javascript
// Remove all listeners when unmounting
componentWillUnmount() {
  socket.removeAllListeners(); // Remove all
  // Or remove specific listeners
  socket.off('newReport');
  socket.off('statusChanged');
}
```

---

## API Reference

### Connection Methods

```javascript
socket.connect()        // Manually connect
socket.disconnect()     // Manually disconnect
socket.connected        // Check if connected
socket.id               // Get socket ID
```

### Event Methods

```javascript
socket.on(event, callback)       // Listen for event
socket.off(event, callback)      // Remove listener
socket.emit(event, data)         // Send event to server
socket.removeAllListeners()      // Remove all listeners
```

### Available Events (Client receives)

| Event | Description |
|-------|-------------|
| `connect` | Successfully connected |
| `disconnect` | Disconnected from server |
| `connected` | Welcome message with user info |
| `newReport` | New anonymous report submitted |
| `statusChanged` | Report status updated |
| `reportUpdated` | Report details changed |
| `reportAssigned` | Case assigned to investigator |
| `newComment` | Comment added to case |
| `systemAlert` | System-wide alert |
| `serverShutdown` | Server shutting down |
| `error` | Connection error occurred |

---

## Complete Example

```javascript
// Complete working example
import io from 'socket.io-client';

class WhistleProClient {
  constructor(serverUrl, token = null) {
    this.socket = io(serverUrl, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('✓ Connected:', this.socket.id);
    });

    this.socket.on('connected', (data) => {
      console.log('Welcome:', data.message);
      console.log('Role:', data.user.role);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('✗ Disconnected:', reason);
    });

    this.socket.on('newReport', (data) => {
      console.log('📢 New Report:', data.report.caseId);
      this.onNewReport(data);
    });

    this.socket.on('statusChanged', (data) => {
      console.log(`🔄 Status: ${data.caseId} → ${data.newStatus}`);
      this.onStatusChanged(data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error:', error);
    });
  }

  // Override these in your implementation
  onNewReport(data) {}
  onStatusChanged(data) {}

  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const client = new WhistleProClient('http://localhost:3005', 'your-jwt-token');

client.onNewReport = (data) => {
  // Your custom logic
  alert(`New report: ${data.report.title}`);
};

client.onStatusChanged = (data) => {
  // Your custom logic
  updateUI(data.caseId, data.newStatus);
};
```

---

## Support

For issues or questions:
- Backend Endpoint: `http://localhost:3005/api/realtime/status`
- Documentation: See `README.md`
- Team Contact: Kelvin (Backend Developer)

---

**Happy Coding! 🚀**
