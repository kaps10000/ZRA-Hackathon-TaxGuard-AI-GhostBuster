const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Tax Event Templates System
 * Pre-defined templates for common tax events
 */

const templates = {
    vatFiling: {
        name: 'VAT Return Filing',
        eventType: 'filing',
        description: 'Standard VAT return filing template',
        requiredFields: ['period', 'amount', 'status'],
        optionalFields: ['notes', 'attachments'],
        example: {
            period: 'Q3-2025',
            amount: 'K50,000',
            status: 'Submitted',
            deadline: 'Met'
        }
    },
    incomeTaxPayment: {
        name: 'Income Tax Payment',
        eventType: 'payment',
        description: 'Individual or corporate income tax payment',
        requiredFields: ['amount', 'method', 'reference'],
        optionalFields: ['notes'],
        example: {
            amount: 'K25,000',
            method: 'Bank Transfer',
            reference: 'PAY2025001'
        }
    },
    penaltyAssessment: {
        name: 'Penalty Assessment',
        eventType: 'auditFlag',
        description: 'Late payment or filing penalty',
        requiredFields: ['penaltyType', 'amount', 'reason'],
        optionalFields: ['dueDate', 'notes'],
        example: {
            penaltyType: 'Late Filing',
            amount: 'K5,000',
            reason: 'VAT return filed 15 days late'
        }
    },
    complianceCheck: {
        name: 'Compliance Verification',
        eventType: 'compliance',
        description: 'Regular compliance status check',
        requiredFields: ['checkType', 'result', 'verifiedBy'],
        optionalFields: ['issues', 'recommendations'],
        example: {
            checkType: 'Business License',
            result: 'Valid',
            verifiedBy: 'System'
        }
    },
    riskAlert: {
        name: 'AI Risk Alert',
        eventType: 'auditFlag',
        description: 'AI-generated risk detection alert',
        requiredFields: ['riskType', 'riskScore', 'factors'],
        optionalFields: ['recommendedAction'],
        example: {
            riskType: 'Revenue Mismatch',
            riskScore: '85/100',
            factors: ['Large variance in declared vs expected revenue']
        }
    },
    whistleblowerReport: {
        name: 'Anonymous Whistleblower Report',
        eventType: 'whistleblower',
        description: 'Anonymous tax evasion or fraud report',
        requiredFields: ['reportType', 'targetEntity', 'allegations'],
        optionalFields: ['evidence', 'priority'],
        example: {
            reportType: 'Tax Evasion',
            targetEntity: 'Company XYZ',
            allegations: 'Unreported revenue streams'
        }
    },
    taxAmendment: {
        name: 'Tax Filing Amendment',
        eventType: 'filing',
        description: 'Amendment to previously filed tax return',
        requiredFields: ['originalFilingId', 'amendmentReason', 'changedFields'],
        optionalFields: ['additionalTax', 'notes'],
        example: {
            originalFilingId: 'FILING-2025-001',
            amendmentReason: 'Calculation error correction',
            changedFields: 'Total taxable income'
        }
    },
    refundRequest: {
        name: 'Tax Refund Request',
        eventType: 'payment',
        description: 'Request for tax overpayment refund',
        requiredFields: ['refundAmount', 'reason', 'accountDetails'],
        optionalFields: ['supportingDocs'],
        example: {
            refundAmount: 'K10,000',
            reason: 'Overpayment in Q2',
            accountDetails: 'Bank Account: XXXX-XXXX'
        }
    },
    auditInitiation: {
        name: 'Audit Initiation',
        eventType: 'auditFlag',
        description: 'Formal audit process initiation',
        requiredFields: ['auditType', 'auditPeriod', 'assignedOfficer'],
        optionalFields: ['expectedDuration', 'focus'],
        example: {
            auditType: 'Comprehensive',
            auditPeriod: '2024-2025',
            assignedOfficer: 'AUD-001',
            focus: 'Revenue declaration accuracy'
        }
    },
    extensionRequest: {
        name: 'Filing Extension Request',
        eventType: 'compliance',
        description: 'Request for filing deadline extension',
        requiredFields: ['originalDeadline', 'requestedExtension', 'justification'],
        optionalFields: ['status'],
        example: {
            originalDeadline: '2025-10-15',
            requestedExtension: '30 days',
            justification: 'Business system migration'
        }
    }
};

// GET /api/templates - List all available templates
router.get('/', (req, res) => {
    try {
        const templateList = Object.entries(templates).map(([id, template]) => ({
            id,
            name: template.name,
            eventType: template.eventType,
            description: template.description
        }));

        res.json({
            success: true,
            count: templateList.length,
            templates: templateList
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/templates/:templateId - Get specific template details
router.get('/:templateId', (req, res) => {
    try {
        const templateId = req.params.templateId;
        const template = templates[templateId];

        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                availableTemplates: Object.keys(templates)
            });
        }

        res.json({
            success: true,
            templateId,
            template
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/templates/:templateId/create - Create event from template
router.post('/:templateId/create', (req, res) => {
    try {
        const templateId = req.params.templateId;
        const template = templates[templateId];

        if (!template) {
            return res.status(404).json({
                error: 'Template not found'
            });
        }

        const { anonymizedUserId, data, notes } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        // Validate required fields
        const missingFields = template.requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields,
                requiredFields: template.requiredFields
            });
        }

        // Generate event
        const eventId = uuidv4();
        const timestamp = new Date().toISOString();

        // Create payload hash from template data
        const payloadString = JSON.stringify({ templateId, ...data });
        const hashOfPayload = crypto.createHash('sha256')
            .update(payloadString)
            .digest('hex');

        // Format notes
        const formattedNotes = `[${template.name}] ` +
            Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ') +
            (notes ? ` | ${notes}` : '');

        // Create event
        const event = blockchain.createEvent(
            eventId,
            template.eventType,
            timestamp,
            anonymizedUserId,
            hashOfPayload,
            formattedNotes
        );

        res.status(201).json({
            success: true,
            message: `Event created from template: ${template.name}`,
            templateId,
            event,
            templateData: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/templates/custom - Create custom template
router.post('/custom', (req, res) => {
    try {
        const { name, eventType, description, requiredFields, optionalFields, example } = req.body;

        if (!name || !eventType || !requiredFields) {
            return res.status(400).json({
                error: 'name, eventType, and requiredFields are required'
            });
        }

        const templateId = name.toLowerCase().replace(/\s+/g, '_');

        // Add custom template (in production, this would be persisted)
        templates[templateId] = {
            name,
            eventType,
            description: description || 'Custom template',
            requiredFields,
            optionalFields: optionalFields || [],
            example: example || {},
            custom: true
        };

        res.status(201).json({
            success: true,
            message: 'Custom template created',
            templateId,
            template: templates[templateId]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/templates/type/:eventType - Get templates by event type
router.get('/type/:eventType', (req, res) => {
    try {
        const eventType = req.params.eventType;

        const filteredTemplates = Object.entries(templates)
            .filter(([id, template]) => template.eventType === eventType)
            .map(([id, template]) => ({
                id,
                name: template.name,
                description: template.description,
                requiredFields: template.requiredFields
            }));

        res.json({
            success: true,
            eventType,
            count: filteredTemplates.length,
            templates: filteredTemplates
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/templates/validate - Validate data against template
router.post('/validate', (req, res) => {
    try {
        const { templateId, data } = req.body;

        if (!templateId || !data) {
            return res.status(400).json({
                error: 'templateId and data are required'
            });
        }

        const template = templates[templateId];

        if (!template) {
            return res.status(404).json({
                error: 'Template not found'
            });
        }

        const missingFields = template.requiredFields.filter(field => !data[field]);
        const isValid = missingFields.length === 0;

        res.json({
            valid: isValid,
            templateId,
            missingFields: missingFields.length > 0 ? missingFields : undefined,
            requiredFields: template.requiredFields,
            providedFields: Object.keys(data)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
