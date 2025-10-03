const Report = require('../models/Report');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

// Validation schemas
const createReportSchema = Joi.object({
  category: Joi.string().valid(
    'tax_evasion',
    'fraud',
    'corruption',
    'phantom_employees',
    'ghost_companies',
    'money_laundering',
    'bribery',
    'other'
  ).required(),
  
  title: Joi.string().min(10).max(200).required(),
  
  description: Joi.string().min(50).max(5000).required(),
  
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  
  evidence: Joi.object({
    documents: Joi.array().items(Joi.string()).optional(),
    photos: Joi.array().items(Joi.string()).optional(),
    videos: Joi.array().items(Joi.string()).optional(),
    witnesses: Joi.array().items(Joi.object({
      name: Joi.string().optional(),
      contact: Joi.string().optional(),
      description: Joi.string().optional()
    })).optional(),
    financial_details: Joi.object({
      estimated_amount: Joi.number().min(0).optional(),
      currency: Joi.string().default('ZMW').optional(),
      frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'yearly', 'ongoing').optional()
    }).optional()
  }).optional(),
  
  subjects: Joi.object({
    individuals: Joi.array().items(Joi.object({
      name: Joi.string().optional(),
      position: Joi.string().optional(),
      organization: Joi.string().optional(),
      tpin: Joi.string().optional(),
      nrc: Joi.string().optional()
    })).optional(),
    organizations: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      tpin: Joi.string().optional(),
      pacra_number: Joi.string().optional(),
      address: Joi.string().optional(),
      description: Joi.string().optional()
    })).optional()
  }).optional(),
  
  location: Joi.object({
    province: Joi.string().optional(),
    district: Joi.string().optional(),
    area: Joi.string().optional(),
    specific_address: Joi.string().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional()
    }).optional()
  }).optional(),
  
  timeline: Joi.object({
    incident_date: Joi.date().optional(),
    discovery_date: Joi.date().optional(),
    ongoing: Joi.boolean().default(false)
  }).optional(),
  
  reporter_info: Joi.object({
    anonymous: Joi.boolean().default(true),
    contact_preference: Joi.string().valid('none', 'secure_message', 'phone', 'email').default('none'),
    contact_details: Joi.string().optional()
  }).optional()
});

/**
 * Create a new anonymous report
 * POST /api/reports
 */
const createReport = asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createReportSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid report data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    });
  }

  // Create metadata for audit trail
  const metadata = {
    ip_hash: req.hashedIP,
    user_agent_hash: req.hashedUserAgent
  };

  // Create the report
  const report = await Report.create(value, metadata);

  // Log successful creation
  console.log(`📄 New anonymous report created: ${report.case_id}`);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully. Please save your case ID for future reference.',
    data: {
      case_id: report.case_id,
      category: report.category,
      status: report.status,
      priority: report.priority,
      created_at: report.created_at,
      blockchain_hash: report.metadata_hash
    }
  });
});

/**
 * Get report by case ID (investigators only)
 * GET /api/reports/:caseId
 */
const getReportByCaseId = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  
  if (!caseId || !caseId.match(/^ZRA-\d{4}-[A-F0-9]{6}$/)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid case ID format. Expected format: ZRA-YYYY-XXXXXX',
        code: 'INVALID_CASE_ID'
      }
    });
  }

  const report = await Report.findByCaseId(caseId, req.investigator.id);

  if (!report) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: report
  });
});

/**
 * List reports with pagination and filtering (investigators only)
 * GET /api/reports
 */
const getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
  const status = req.query.status;
  const category = req.query.category;
  const priority = req.query.priority;

  const options = {
    page,
    limit,
    status,
    category,
    priority,
    investigatorId: req.investigator.id
  };

  const result = await Report.list(options);

  res.json({
    success: true,
    data: result.reports,
    pagination: result.pagination,
    filters: {
      status: status || 'all',
      category: category || 'all',
      priority: priority || 'all'
    }
  });
});

/**
 * Update report status (investigators only)
 * PATCH /api/reports/:caseId/status
 */
const updateReportStatus = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { status, notes } = req.body;

  // Validate status
  const validStatuses = ['pending', 'under_review', 'investigating', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      }
    });
  }

  const updatedReport = await Report.updateStatus(
    caseId,
    status,
    req.investigator.id,
    notes
  );

  res.json({
    success: true,
    message: 'Report status updated successfully',
    data: updatedReport
  });
});

/**
 * Get report statistics (supervisors and admins only)
 * GET /api/reports/stats
 */
const getReportStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, category, status } = req.query;

  // This would be implemented with database queries
  // For now, return mock data for demo
  const stats = {
    total_reports: 156,
    pending_reports: 23,
    under_review: 45,
    investigating: 67,
    closed: 21,
    by_category: {
      tax_evasion: 45,
      fraud: 34,
      corruption: 28,
      phantom_employees: 23,
      ghost_companies: 12,
      other: 14
    },
    by_priority: {
      low: 34,
      medium: 89,
      high: 28,
      critical: 5
    },
    monthly_trend: [
      { month: 'Jan', reports: 12 },
      { month: 'Feb', reports: 18 },
      { month: 'Mar', reports: 23 },
      { month: 'Apr', reports: 31 },
      { month: 'May', reports: 28 },
      { month: 'Jun', reports: 44 }
    ]
  };

  res.json({
    success: true,
    data: stats,
    filters: {
      start_date: startDate,
      end_date: endDate,
      category,
      status
    }
  });
});

module.exports = {
  createReport,
  getReportByCaseId,
  getReports,
  updateReportStatus,
  getReportStats
};