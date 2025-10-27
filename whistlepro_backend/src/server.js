const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const realtimeService = require('./services/realtimeService');
const { socketAuth, assignRooms } = require('./middleware/socketAuth');
const encryptionService = require('./services/encryptionService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:4001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:4001'], credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Utility function to try decrypting data
const tryDecrypt = (data) => {
  if (!data || typeof data !== 'string') {
    return data;
  }

  try {
    // Check if data looks encrypted (contains colons for iv:tag:data format)
    if (data.includes(':')) {
      const decrypted = encryptionService.decrypt(data);
      console.log('✓ Decrypted data successfully');
      return decrypted;
    }

    // If no colons, might be plain text or different encryption
    // Return as-is for now
    return data;
  } catch (error) {
    console.warn('⚠️  Decryption failed, using original data:', error.message);
    return data;
  }
};

// Middleware to decrypt incoming report data
const decryptReportData = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const encryptedFields = ['title', 'description', 'company', 'category'];

    encryptedFields.forEach(field => {
      if (req.body[field]) {
        const original = req.body[field];
        req.body[field] = tryDecrypt(original);

        if (original !== req.body[field]) {
          console.log(`✓ Decrypted field: ${field}`);
        }
      }
    });
  }

  next();
};

let reports = [
  {
    id: 1, caseId: 'WP-001', title: 'Tax Evasion at ABC Mining', company: 'ABC Mining Ltd',
    category: 'Tax Evasion', priority: 'High', status: 'Under Investigation',
    reportedDate: '2025-10-15', reporter: 'Anonymous', assignedTo: 'John Doe',
    description: 'Company suspected of underreporting revenue.',
    evidence: ['Document scans', 'Financial records']
  },
  {
    id: 2, caseId: 'WP-002', title: 'Phantom Employees at XYZ Traders', company: 'XYZ Traders',
    category: 'Payroll Fraud', priority: 'Critical', status: 'Open',
    reportedDate: '2025-10-14', reporter: 'Anonymous', assignedTo: 'Mary Johnson',
    description: 'Several employees on payroll do not exist.',
    evidence: ['Payroll documents']
  }
];

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// File upload endpoint - supports multiple files
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    console.log(`📎 ${req.files.length} file(s) uploaded successfully`);

    res.status(200).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', message: error.message });
  }
});

// Get uploaded file info
app.get('/api/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stats = fs.statSync(filePath);

  res.json({
    filename: req.params.filename,
    size: stats.size,
    url: `/uploads/${req.params.filename}`,
    uploadedAt: stats.birthtime
  });
});

// Delete uploaded file (for cleanup or mistakes)
app.delete('/api/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    console.log(`🗑️ File deleted: ${req.params.filename}`);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed', message: error.message });
  }
});

// Real-time service status endpoint
app.get('/api/realtime/status', (req, res) => {
  const uptime = Math.floor((new Date() - connectionStats.startTime) / 1000);

  res.json({
    active: realtimeService.isActive(),
    connectedClients: realtimeService.getConnectedCount(),
    currentConnections: {
      total: activeConnections,
      authenticated: connectionStats.authenticated,
      anonymous: connectionStats.anonymous
    },
    statistics: {
      totalConnectionsSinceStart: connectionStats.total,
      peakConnections: connectionStats.peakConnections,
      uptimeSeconds: uptime,
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
    },
    availableEvents: realtimeService.getEvents()
  });
});

// Get all reports
app.get('/api/reports', (req, res) => res.json({ total: reports.length, reports }));
app.get('/api/reports/:caseId', (req, res) => {
  const report = reports.find(r => r.caseId === req.params.caseId);
  if (!report) return res.status(404).json({ error: 'Not found' });
  res.json(report);
});

// Submit report with optional file uploads (with decryption support)
app.post('/api/reports', upload.array('evidence', 10), decrypt ReportData, (req, res) => {
  try {
    const newId = reports.length + 1;
    const caseId = 'WP-' + String(newId).padStart(3, '0');

    // Handle file uploads if any
    let evidenceFiles = [];
    if (req.files && req.files.length > 0) {
      evidenceFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date().toISOString()
      }));
      console.log(`📎 ${req.files.length} evidence file(s) uploaded with report`);
    }

    // Parse JSON data from form field if it exists (for multipart/form-data)
    let reportData = {};
    if (req.body.data) {
      try {
        reportData = JSON.parse(req.body.data);
      } catch (e) {
        reportData = req.body;
      }
    } else {
      reportData = req.body;
    }

    const newReport = {
      id: newId,
      caseId,
      status: 'Open',
      reportedDate: new Date().toISOString().split('T')[0],
      ...reportData,
      evidenceFiles: evidenceFiles.length > 0 ? evidenceFiles : undefined
    };

    reports.unshift(newReport);

    // Emit real-time event to all authenticated investigators
    realtimeService.emitNewReport(newReport);

    console.log(`📝 New report submitted: ${caseId} - Broadcasting to investigators`);

    res.status(201).json({
      success: true,
      caseId,
      message: 'Report submitted successfully',
      evidenceCount: evidenceFiles.length
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ error: 'Report submission failed', message: error.message });
  }
});

app.patch('/api/reports/:caseId/status', (req, res) => {
  const report = reports.find(r => r.caseId === req.params.caseId);
  if (!report) return res.status(404).json({ error: 'Not found' });

  const oldStatus = report.status;
  const newStatus = req.body.status;

  report.status = newStatus;

  // Emit real-time status change event
  realtimeService.emitStatusChanged(report.caseId, oldStatus, newStatus);

  console.log(`🔄 Status updated: ${report.caseId} (${oldStatus} → ${newStatus}) - Broadcasting`);

  res.json({
    success: true,
    caseId: report.caseId,
    oldStatus,
    newStatus,
    message: 'Status updated successfully'
  });
});

// Apply Socket.io authentication middleware
io.use(socketAuth);

// Initialize real-time service
realtimeService.initialize(io);

// Connection tracking and statistics
let activeConnections = 0;
const connectionStats = {
  total: 0,
  authenticated: 0,
  anonymous: 0,
  peakConnections: 0,
  startTime: new Date()
};

// Socket.io connection handling with enhanced error handling
io.on('connection', (socket) => {
  activeConnections++;
  connectionStats.total++;

  // Assign user to appropriate rooms
  assignRooms(socket);

  const userInfo = socket.user.isAuthenticated
    ? `${socket.user.username} (${socket.user.role})`
    : 'Anonymous';

  // Update stats
  if (socket.user.isAuthenticated) {
    connectionStats.authenticated++;
  } else {
    connectionStats.anonymous++;
  }

  if (activeConnections > connectionStats.peakConnections) {
    connectionStats.peakConnections = activeConnections;
  }

  console.log(`✓ Socket.io connection: ${userInfo} - ID: ${socket.id} - Active: ${activeConnections}`);

  // Send welcome message with user context
  socket.emit('connected', {
    message: 'Connected to WhistlePro real-time service',
    socketId: socket.id,
    user: {
      isAuthenticated: socket.user.isAuthenticated,
      role: socket.user.role,
      username: socket.user.username
    },
    timestamp: new Date().toISOString(),
    availableEvents: realtimeService.getEvents(),
    serverTime: new Date().toISOString()
  });

  // Handle heartbeat/ping for connection health
  socket.on('ping', (callback) => {
    if (callback) callback({ pong: true, serverTime: new Date().toISOString() });
  });

  // Handle disconnection with detailed logging
  socket.on('disconnect', (reason) => {
    activeConnections--;
    if (socket.user.isAuthenticated) {
      connectionStats.authenticated--;
    } else {
      connectionStats.anonymous--;
    }

    const disconnectReasons = {
      'transport close': 'Connection lost (network issue)',
      'client namespace disconnect': 'Client intentionally disconnected',
      'server namespace disconnect': 'Server closed connection',
      'ping timeout': 'Connection timeout (no response)',
      'transport error': 'Transport layer error'
    };

    const readableReason = disconnectReasons[reason] || reason;

    console.log(`✗ Socket disconnected: ${userInfo} (ID: ${socket.id}) - Reason: ${readableReason} - Active: ${activeConnections}`);
  });

  // Handle connection errors with detailed logging
  socket.on('error', (error) => {
    console.error(`❌ Socket error (${userInfo}, ID: ${socket.id}):`, {
      message: error.message,
      code: error.code,
      type: error.type
    });

    // Send error back to client
    socket.emit('error', {
      message: 'Connection error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    });
  });

  // Handle reconnection
  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Client reconnected: ${userInfo} - Attempt: ${attemptNumber}`);
    socket.emit('reconnected', {
      message: 'Successfully reconnected',
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  });

  // Connection timeout warning
  const connectionTimeout = setTimeout(() => {
    if (socket.connected) {
      console.log(`⏰ Long-lived connection: ${userInfo} - Duration: 30 minutes`);
    }
  }, 30 * 60 * 1000); // 30 minutes

  // Clear timeout on disconnect
  socket.on('disconnect', () => {
    clearTimeout(connectionTimeout);
  });
});

// Make io and realtime service available to other parts of the app
app.set('io', io);
app.set('realtimeService', realtimeService);

server.listen(PORT, () => {
  console.log('WhistlePro Backend on port', PORT);
  console.log('Real-time Socket.io server enabled');
  console.log(`Statistics endpoint: http://localhost:${PORT}/api/realtime/status`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Notify all connected clients
  io.emit('serverShutdown', {
    message: 'Server is shutting down. Please reconnect in a moment.',
    timestamp: new Date().toISOString()
  });

  // Close all Socket.io connections gracefully
  io.close(() => {
    console.log('All Socket.io connections closed');
    console.log(`Final statistics:`);
    console.log(`  - Total connections: ${connectionStats.total}`);
    console.log(`  - Peak connections: ${connectionStats.peakConnections}`);
    console.log(`  - Uptime: ${Math.floor((new Date() - connectionStats.startTime) / 1000)}s`);

    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
