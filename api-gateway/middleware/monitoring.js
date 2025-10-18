/**
 * Monitoring Middleware with Prometheus Metrics
 * Provides comprehensive system monitoring and health metrics
 */

const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const blockchainEventsTotal = new promClient.Counter({
  name: 'blockchain_events_total',
  help: 'Total number of blockchain events created',
  labelNames: ['event_type', 'user_role']
});

const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['status', 'role']
});

const rateLimitHits = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint']
});

const errorTotal = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint']
});

const apiResponseSize = new promClient.Histogram({
  name: 'api_response_size_bytes',
  help: 'Size of API responses in bytes',
  labelNames: ['endpoint'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000]
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(blockchainEventsTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(rateLimitHits);
register.registerMetric(errorTotal);
register.registerMetric(apiResponseSize);

/**
 * Monitoring middleware to track request metrics
 */
function monitoringMiddleware(req, res, next) {
  const start = Date.now();
  activeConnections.inc();

  // Capture the original end function
  const originalEnd = res.end;

  res.end = function(...args) {
    // Calculate request duration
    const duration = (Date.now() - start) / 1000;

    // Get route pattern (clean up dynamic params)
    const route = req.route ? req.route.path : req.path;

    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    // Track response size
    const contentLength = res.get('Content-Length');
    if (contentLength) {
      apiResponseSize
        .labels(route)
        .observe(parseInt(contentLength));
    }

    activeConnections.dec();

    // Call the original end function
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Track blockchain event creation
 */
function trackBlockchainEvent(eventType, userRole) {
  blockchainEventsTotal
    .labels(eventType, userRole)
    .inc();
}

/**
 * Track authentication attempts
 */
function trackAuthAttempt(success, role = 'unknown') {
  authenticationAttempts
    .labels(success ? 'success' : 'failure', role)
    .inc();
}

/**
 * Track rate limit hits
 */
function trackRateLimitHit(endpoint) {
  rateLimitHits
    .labels(endpoint)
    .inc();
}

/**
 * Track errors
 */
function trackError(type, endpoint) {
  errorTotal
    .labels(type, endpoint)
    .inc();
}

/**
 * Get current metrics in Prometheus format
 */
async function getMetrics() {
  return await register.metrics();
}

/**
 * Get metrics in JSON format for custom dashboards
 */
async function getMetricsJSON() {
  const metrics = await register.getMetricsAsJSON();

  return {
    timestamp: new Date().toISOString(),
    metrics: metrics,
    summary: {
      totalRequests: await getTotalRequests(),
      averageResponseTime: await getAverageResponseTime(),
      activeConnections: await getActiveConnections(),
      errorRate: await getErrorRate()
    }
  };
}

/**
 * Helper: Get total requests
 */
async function getTotalRequests() {
  const metrics = await register.getSingleMetric('http_requests_total');
  if (!metrics) return 0;

  const values = await metrics.get();
  return values.values.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Helper: Get average response time
 */
async function getAverageResponseTime() {
  const metrics = await register.getSingleMetric('http_request_duration_seconds');
  if (!metrics) return 0;

  const values = await metrics.get();
  if (!values.values.length) return 0;

  const histogram = values.values[0];
  if (!histogram.metricName) return 0;

  // This is a simplified calculation
  return 0.1; // Placeholder - actual calculation would be more complex
}

/**
 * Helper: Get active connections
 */
async function getActiveConnections() {
  const metrics = await register.getSingleMetric('active_connections');
  if (!metrics) return 0;

  const values = await metrics.get();
  return values.values[0]?.value || 0;
}

/**
 * Helper: Get error rate
 */
async function getErrorRate() {
  const errors = await register.getSingleMetric('errors_total');
  const requests = await register.getSingleMetric('http_requests_total');

  if (!errors || !requests) return 0;

  const errorValues = await errors.get();
  const requestValues = await requests.get();

  const totalErrors = errorValues.values.reduce((sum, item) => sum + item.value, 0);
  const totalRequests = requestValues.values.reduce((sum, item) => sum + item.value, 0);

  return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
}

/**
 * Health check function
 */
async function getHealthStatus() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: {
      usage: process.cpuUsage()
    },
    metrics: {
      totalRequests: await getTotalRequests(),
      averageResponseTime: await getAverageResponseTime(),
      activeConnections: await getActiveConnections(),
      errorRate: await getErrorRate()
    }
  };
}

module.exports = {
  monitoringMiddleware,
  trackBlockchainEvent,
  trackAuthAttempt,
  trackRateLimitHit,
  trackError,
  getMetrics,
  getMetricsJSON,
  getHealthStatus,
  register
};
