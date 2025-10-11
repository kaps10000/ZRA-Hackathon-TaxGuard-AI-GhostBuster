const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { blockchain } = require('../scripts/add-sample-events');
const { broadcastEvent } = require('./websocket');

/**
 * Automated Compliance Triggers
 * Smart contract rules that auto-trigger actions
 */

// In-memory trigger storage (would be persisted in production)
const activeTriggers = new Map();
const triggerHistory = [];

// Trigger rule definitions
const triggerRules = {
    latePaymentPenalty: {
        name: 'Late Payment Penalty',
        condition: 'latePaymentCount > 3',
        action: 'createAuditFlag',
        severity: 'HIGH',
        description: 'Automatic audit flag when 3+ late payments detected'
    },
    highRiskAlert: {
        name: 'High Risk Score Alert',
        condition: 'riskScore > 75',
        action: 'notifyAuditor',
        severity: 'CRITICAL',
        description: 'Alert auditor when risk score exceeds threshold'
    },
    complianceGracePeriod: {
        name: 'Compliance Grace Period',
        condition: 'firstViolation = true',
        action: 'grantExtension',
        severity: 'LOW',
        description: 'Automatic 7-day grace period for first-time violations'
    },
    repeatedAmendments: {
        name: 'Repeated Amendments Alert',
        condition: 'amendmentCount > 5',
        action: 'escalateReview',
        severity: 'MEDIUM',
        description: 'Escalate when taxpayer amends returns repeatedly'
    },
    suspiciousActivity: {
        name: 'Suspicious Activity Detection',
        condition: 'eventsPerDay > 10',
        action: 'freezeAccount',
        severity: 'CRITICAL',
        description: 'Freeze account for unusual activity patterns'
    }
};

// POST /api/triggers/create - Create new trigger
router.post('/create', (req, res) => {
    try {
        const { name, condition, action, severity, targetUserId } = req.body;

        if (!name || !condition || !action) {
            return res.status(400).json({
                error: 'name, condition, and action are required'
            });
        }

        const triggerId = uuidv4();
        const trigger = {
            id: triggerId,
            name,
            condition,
            action,
            severity: severity || 'MEDIUM',
            targetUserId: targetUserId || 'all',
            active: true,
            createdAt: new Date().toISOString(),
            executionCount: 0,
            lastExecuted: null
        };

        activeTriggers.set(triggerId, trigger);

        res.status(201).json({
            success: true,
            message: 'Trigger created successfully',
            trigger
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/triggers - List all active triggers
router.get('/', (req, res) => {
    try {
        const triggers = Array.from(activeTriggers.values());

        res.json({
            success: true,
            count: triggers.length,
            triggers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/triggers/rules - Get predefined trigger rules
router.get('/rules', (req, res) => {
    try {
        const rules = Object.entries(triggerRules).map(([id, rule]) => ({
            id,
            ...rule
        }));

        res.json({
            success: true,
            count: rules.length,
            rules
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/triggers/evaluate - Evaluate triggers for a user
router.post('/evaluate', async (req, res) => {
    try {
        const { anonymizedUserId } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === anonymizedUserId);

        const evaluations = await evaluateTriggers(anonymizedUserId, events);

        res.json({
            success: true,
            userId: anonymizedUserId,
            evaluatedAt: new Date().toISOString(),
            triggersEvaluated: evaluations.length,
            triggersActivated: evaluations.filter(e => e.triggered).length,
            evaluations
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/triggers/auto-execute - Auto-execute trigger actions
router.post('/auto-execute', async (req, res) => {
    try {
        const { anonymizedUserId } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === anonymizedUserId);

        const results = await autoExecuteTriggers(anonymizedUserId, events);

        res.json({
            success: true,
            userId: anonymizedUserId,
            executedAt: new Date().toISOString(),
            actionsExecuted: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/triggers/penalty/calculate - Calculate penalty automatically
router.post('/penalty/calculate', (req, res) => {
    try {
        const { anonymizedUserId, violationType, daysLate } = req.body;

        if (!anonymizedUserId || !violationType) {
            return res.status(400).json({
                error: 'anonymizedUserId and violationType are required'
            });
        }

        const penalty = calculatePenalty(violationType, daysLate || 0);

        // Auto-create penalty event
        const eventId = uuidv4();
        const hashOfPayload = crypto.createHash('sha256')
            .update(JSON.stringify(penalty))
            .digest('hex');

        const event = blockchain.createEvent(
            eventId,
            'auditFlag',
            new Date().toISOString(),
            anonymizedUserId,
            hashOfPayload,
            `Automated Penalty: ${violationType} | Amount: K${penalty.amount} | Days Late: ${daysLate}`
        );

        broadcastEvent(event);

        res.json({
            success: true,
            penalty,
            event,
            message: 'Penalty calculated and recorded on blockchain'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/triggers/grace-period/grant - Grant grace period
router.post('/grace-period/grant', (req, res) => {
    try {
        const { anonymizedUserId, reason, days } = req.body;

        if (!anonymizedUserId) {
            return res.status(400).json({
                error: 'anonymizedUserId is required'
            });
        }

        const gracePeriod = {
            userId: anonymizedUserId,
            reason: reason || 'First-time violation',
            days: days || 7,
            grantedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (days || 7) * 24 * 60 * 60 * 1000).toISOString()
        };

        // Create compliance event
        const eventId = uuidv4();
        const hashOfPayload = crypto.createHash('sha256')
            .update(JSON.stringify(gracePeriod))
            .digest('hex');

        const event = blockchain.createEvent(
            eventId,
            'compliance',
            new Date().toISOString(),
            anonymizedUserId,
            hashOfPayload,
            `Grace Period Granted: ${days} days | Reason: ${reason}`
        );

        res.json({
            success: true,
            gracePeriod,
            event,
            message: 'Grace period granted and recorded'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/triggers/:triggerId - Deactivate trigger
router.delete('/:triggerId', (req, res) => {
    try {
        const triggerId = req.params.triggerId;
        const trigger = activeTriggers.get(triggerId);

        if (!trigger) {
            return res.status(404).json({
                error: 'Trigger not found'
            });
        }

        trigger.active = false;
        trigger.deactivatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Trigger deactivated',
            trigger
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/triggers/history - Get trigger execution history
router.get('/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = triggerHistory.slice(-limit);

        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
async function evaluateTriggers(userId, events) {
    const evaluations = [];

    // Evaluate late payment trigger
    const latePayments = events.filter(e =>
        e.notes.toLowerCase().includes('late')
    ).length;

    evaluations.push({
        rule: 'latePaymentPenalty',
        triggered: latePayments > 3,
        condition: 'latePaymentCount > 3',
        actualValue: latePayments,
        severity: 'HIGH'
    });

    // Evaluate amendment trigger
    const amendments = events.filter(e =>
        e.notes.toLowerCase().includes('amendment')
    ).length;

    evaluations.push({
        rule: 'repeatedAmendments',
        triggered: amendments > 5,
        condition: 'amendmentCount > 5',
        actualValue: amendments,
        severity: 'MEDIUM'
    });

    // Evaluate suspicious activity
    const recentEvents = events.filter(e =>
        (Date.now() - new Date(e.timestamp).getTime()) < 24 * 60 * 60 * 1000
    ).length;

    evaluations.push({
        rule: 'suspiciousActivity',
        triggered: recentEvents > 10,
        condition: 'eventsPerDay > 10',
        actualValue: recentEvents,
        severity: 'CRITICAL'
    });

    return evaluations;
}

async function autoExecuteTriggers(userId, events) {
    const results = [];
    const evaluations = await evaluateTriggers(userId, events);

    for (const evaluation of evaluations.filter(e => e.triggered)) {
        const action = executeAction(evaluation.rule, userId, evaluation);
        results.push(action);

        // Record in history
        triggerHistory.push({
            triggerId: evaluation.rule,
            userId,
            executedAt: new Date().toISOString(),
            action: action.action,
            result: action.result
        });
    }

    return results;
}

function executeAction(ruleName, userId, evaluation) {
    const actions = {
        latePaymentPenalty: () => ({
            action: 'CREATE_AUDIT_FLAG',
            result: 'Audit flag created for repeated late payments',
            severity: evaluation.severity
        }),
        repeatedAmendments: () => ({
            action: 'ESCALATE_REVIEW',
            result: 'Case escalated for manual review',
            severity: evaluation.severity
        }),
        suspiciousActivity: () => ({
            action: 'ALERT_AUDITOR',
            result: 'High-priority alert sent to auditor',
            severity: evaluation.severity
        })
    };

    return actions[ruleName] ? actions[ruleName]() : {
        action: 'NO_ACTION',
        result: 'No action defined for this rule'
    };
}

function calculatePenalty(violationType, daysLate) {
    const penaltyRates = {
        'late_filing': 1000 + (daysLate * 50),  // K1000 + K50/day
        'late_payment': 500 + (daysLate * 25),   // K500 + K25/day
        'non_compliance': 2000,                   // Fixed K2000
        'false_declaration': 5000                 // Fixed K5000
    };

    const amount = penaltyRates[violationType] || 1000;

    return {
        violationType,
        daysLate,
        baseAmount: penaltyRates[violationType.split('_')[0]] || 1000,
        lateFee: daysLate * 50,
        totalAmount: amount,
        currency: 'ZMW'
    };
}

module.exports = router;
