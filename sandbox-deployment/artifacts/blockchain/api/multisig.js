const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Multi-Signature Approval Workflow
 * High-value events require multiple signatures
 */

// In-memory storage (would use database in production)
const pendingApprovals = new Map();
const approvalHistory = [];

// POST /api/multisig/create - Create multi-sig event
router.post('/create', (req, res) => {
    try {
        const {
            eventType,
            anonymizedUserId,
            data,
            notes,
            requiredSignatures,
            approvers
        } = req.body;

        if (!eventType || !anonymizedUserId || !data) {
            return res.status(400).json({
                error: 'eventType, anonymizedUserId, and data are required'
            });
        }

        const eventId = uuidv4();
        const hashOfPayload = crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');

        const multiSigEvent = {
            eventId,
            eventType,
            anonymizedUserId,
            hashOfPayload,
            notes: notes || '',
            requiredSignatures: requiredSignatures || 2,
            approvers: approvers || [],
            signatures: [],
            status: 'pending',
            createdAt: new Date().toISOString(),
            createdBy: req.headers['x-user-id'] || 'anonymous',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            data
        };

        pendingApprovals.set(eventId, multiSigEvent);

        res.status(201).json({
            success: true,
            message: 'Multi-signature event created',
            event: {
                eventId,
                status: 'pending',
                requiredSignatures: multiSigEvent.requiredSignatures,
                currentSignatures: 0,
                expiresAt: multiSigEvent.expiresAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/multisig/:eventId/sign - Sign a pending event
router.post('/:eventId/sign', (req, res) => {
    try {
        const eventId = req.params.eventId;
        const { signerId, signature, comments } = req.body;

        if (!signerId) {
            return res.status(400).json({
                error: 'signerId is required'
            });
        }

        const event = pendingApprovals.get(eventId);

        if (!event) {
            return res.status(404).json({
                error: 'Multi-sig event not found or already processed'
            });
        }

        // Check if already signed by this user
        if (event.signatures.some(sig => sig.signerId === signerId)) {
            return res.status(400).json({
                error: 'You have already signed this event'
            });
        }

        // Check if expired
        if (new Date() > new Date(event.expiresAt)) {
            event.status = 'expired';
            return res.status(400).json({
                error: 'Event has expired',
                expiresAt: event.expiresAt
            });
        }

        // Add signature
        const signatureData = {
            signerId,
            signature: signature || generateSignature(signerId, eventId),
            signedAt: new Date().toISOString(),
            comments: comments || ''
        };

        event.signatures.push(signatureData);

        // Check if we have enough signatures
        if (event.signatures.length >= event.requiredSignatures) {
            // Finalize event - add to blockchain
            const blockchainEvent = blockchain.createEvent(
                event.eventId,
                event.eventType,
                new Date().toISOString(),
                event.anonymizedUserId,
                event.hashOfPayload,
                `${event.notes} | Multi-sig approved by ${event.signatures.length} signers`
            );

            event.status = 'approved';
            event.finalizedAt = new Date().toISOString();
            event.blockchainEvent = blockchainEvent;

            // Move to history
            approvalHistory.push(event);
            pendingApprovals.delete(eventId);

            return res.json({
                success: true,
                message: 'Event fully approved and added to blockchain',
                status: 'approved',
                signatures: event.signatures.length,
                blockchainEvent
            });
        }

        res.json({
            success: true,
            message: 'Signature added successfully',
            status: 'pending',
            signaturesCollected: event.signatures.length,
            signaturesRequired: event.requiredSignatures,
            remainingSignatures: event.requiredSignatures - event.signatures.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/multisig/:eventId/reject - Reject a pending event
router.post('/:eventId/reject', (req, res) => {
    try {
        const eventId = req.params.eventId;
        const { signerId, reason } = req.body;

        if (!signerId || !reason) {
            return res.status(400).json({
                error: 'signerId and reason are required'
            });
        }

        const event = pendingApprovals.get(eventId);

        if (!event) {
            return res.status(404).json({
                error: 'Multi-sig event not found'
            });
        }

        event.status = 'rejected';
        event.rejectedBy = signerId;
        event.rejectionReason = reason;
        event.rejectedAt = new Date().toISOString();

        // Move to history
        approvalHistory.push(event);
        pendingApprovals.delete(eventId);

        res.json({
            success: true,
            message: 'Event rejected',
            status: 'rejected',
            rejectedBy: signerId,
            reason
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/multisig/pending - Get all pending approvals
router.get('/pending', (req, res) => {
    try {
        const pending = Array.from(pendingApprovals.values())
            .map(event => ({
                eventId: event.eventId,
                eventType: event.eventType,
                status: event.status,
                createdAt: event.createdAt,
                createdBy: event.createdBy,
                requiredSignatures: event.requiredSignatures,
                currentSignatures: event.signatures.length,
                expiresAt: event.expiresAt,
                isExpired: new Date() > new Date(event.expiresAt)
            }));

        res.json({
            success: true,
            count: pending.length,
            pendingApprovals: pending
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/multisig/:eventId - Get specific multi-sig event details
router.get('/:eventId', (req, res) => {
    try {
        const eventId = req.params.eventId;
        let event = pendingApprovals.get(eventId);

        if (!event) {
            // Check history
            event = approvalHistory.find(e => e.eventId === eventId);
        }

        if (!event) {
            return res.status(404).json({
                error: 'Multi-sig event not found'
            });
        }

        res.json({
            success: true,
            event: {
                ...event,
                signaturesDetails: event.signatures,
                progress: `${event.signatures.length}/${event.requiredSignatures}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/multisig/history - Get approval history
router.get('/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = approvalHistory.slice(-limit).map(event => ({
            eventId: event.eventId,
            eventType: event.eventType,
            status: event.status,
            signatures: event.signatures.length,
            requiredSignatures: event.requiredSignatures,
            createdAt: event.createdAt,
            finalizedAt: event.finalizedAt,
            rejectedBy: event.rejectedBy,
            rejectionReason: event.rejectionReason
        }));

        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/multisig/user/:userId - Get approvals for specific user
router.get('/user/:userId', (req, res) => {
    try {
        const userId = req.params.userId;

        const userApprovals = Array.from(pendingApprovals.values())
            .filter(event =>
                event.approvers.includes(userId) ||
                event.signatures.some(sig => sig.signerId === userId)
            );

        res.json({
            success: true,
            userId,
            count: userApprovals.length,
            approvals: userApprovals.map(event => ({
                eventId: event.eventId,
                status: event.status,
                alreadySigned: event.signatures.some(sig => sig.signerId === userId),
                expiresAt: event.expiresAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/multisig/:eventId/cancel - Cancel pending approval
router.delete('/:eventId/cancel', (req, res) => {
    try {
        const eventId = req.params.eventId;
        const { cancelledBy, reason } = req.body;

        const event = pendingApprovals.get(eventId);

        if (!event) {
            return res.status(404).json({
                error: 'Multi-sig event not found'
            });
        }

        event.status = 'cancelled';
        event.cancelledBy = cancelledBy;
        event.cancellationReason = reason;
        event.cancelledAt = new Date().toISOString();

        approvalHistory.push(event);
        pendingApprovals.delete(eventId);

        res.json({
            success: true,
            message: 'Multi-sig event cancelled',
            eventId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function generateSignature(signerId, eventId) {
    const data = `${signerId}:${eventId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = router;
