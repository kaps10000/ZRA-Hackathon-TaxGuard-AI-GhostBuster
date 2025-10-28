/**
 * Socket.io Authentication Middleware
 * Handles JWT authentication for Socket.io connections
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Socket.io authentication middleware
 * Verifies JWT token and attaches user info to socket
 * Allows both authenticated and anonymous connections
 */
const socketAuth = (socket, next) => {
  try {
    // Get token from handshake query or auth header
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    // If no token provided, treat as anonymous (for public reporters)
    if (!token) {
      socket.user = {
        id: `anonymous-${socket.id}`,
        role: 'anonymous',
        isAuthenticated: false
      };
      console.log(`✓ Anonymous connection accepted: ${socket.id}`);
      return next();
    }

    // Verify JWT token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log(`✗ Invalid token from ${socket.id}: ${err.message}`);
        // Still allow connection but mark as anonymous
        socket.user = {
          id: `anonymous-${socket.id}`,
          role: 'anonymous',
          isAuthenticated: false,
          tokenError: err.message
        };
        return next();
      }

      // Valid token - attach user info
      socket.user = {
        id: decoded.id || decoded.userId,
        username: decoded.username,
        role: decoded.role || 'investigator',
        isAuthenticated: true
      };

      console.log(`✓ Authenticated connection: ${socket.user.username} (${socket.user.role})`);
      next();
    });
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Allow connection but mark as anonymous
    socket.user = {
      id: `anonymous-${socket.id}`,
      role: 'anonymous',
      isAuthenticated: false,
      error: error.message
    };
    next();
  }
};

/**
 * Middleware to assign users to appropriate rooms based on role
 */
const assignRooms = (socket) => {
  if (!socket.user) return;

  if (socket.user.isAuthenticated) {
    // Join role-based rooms for authenticated users
    socket.join('authenticated');
    socket.join(socket.user.role); // e.g., 'investigator', 'supervisor', 'admin'

    console.log(`User ${socket.user.username} joined rooms: authenticated, ${socket.user.role}`);
  } else {
    // Join public room for anonymous users
    socket.join('public');
    console.log(`Anonymous user ${socket.id} joined room: public`);
  }
};

/**
 * Middleware to require authentication for certain events
 */
const requireAuth = (eventHandler) => {
  return function(data, callback) {
    const socket = this;

    if (!socket.user || !socket.user.isAuthenticated) {
      const error = { error: 'Authentication required', code: 401 };
      if (callback) callback(error);
      return socket.emit('error', error);
    }

    // User is authenticated, proceed with event handler
    return eventHandler.call(socket, data, callback);
  };
};

/**
 * Middleware to require specific role
 */
const requireRole = (allowedRoles) => {
  return function(eventHandler) {
    return function(data, callback) {
      const socket = this;

      if (!socket.user || !socket.user.isAuthenticated) {
        const error = { error: 'Authentication required', code: 401 };
        if (callback) callback(error);
        return socket.emit('error', error);
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(socket.user.role)) {
        const error = {
          error: 'Insufficient permissions',
          code: 403,
          required: roles,
          current: socket.user.role
        };
        if (callback) callback(error);
        return socket.emit('error', error);
      }

      // User has required role, proceed
      return eventHandler.call(socket, data, callback);
    };
  };
};

/**
 * Helper to check if socket is authenticated
 */
const isAuthenticated = (socket) => {
  return socket.user && socket.user.isAuthenticated === true;
};

/**
 * Helper to check if socket has specific role
 */
const hasRole = (socket, role) => {
  if (!isAuthenticated(socket)) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(socket.user.role);
};

module.exports = {
  socketAuth,
  assignRooms,
  requireAuth,
  requireRole,
  isAuthenticated,
  hasRole
};
