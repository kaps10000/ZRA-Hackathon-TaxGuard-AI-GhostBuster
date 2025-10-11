const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { blockchain } = require('../scripts/add-sample-events');

/**
 * Event Verification and Integrity Checking Tool
 * Public endpoint for transparency
 */

// GET /api/verify/:eventId - Verify a specific event
router.get('/:eventId', (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = blockchain.readEvent(eventId);

        if (!event) {
            return res.status(404).json({
                verified: false,
                error: 'Event not found',
                eventId
            });
        }

        // Recalculate integrity hash
        const calculatedHash = calculateIntegrityHash(
            event.eventId,
            event.eventType,
            event.anonymizedUserId,
            event.hashOfPayload
        );

        // Verify block hash
        const block = blockchain.chain.find(b => b.index === event.blockIndex);
        const blockValid = block ? verifyBlockIntegrity(block) : false;

        // Check chain integrity from genesis to this block
        const chainValid = verifyChainUpToBlock(event.blockIndex);

        const isValid = blockValid && chainValid;

        res.json({
            verified: isValid,
            eventId: event.eventId,
            verification: {
                eventExists: true,
                blockValid,
                chainValid,
                timestamp: event.timestamp,
                blockIndex: event.blockIndex,
                blockHash: block?.hash
            },
            event: {
                eventType: event.eventType,
                timestamp: event.timestamp,
                anonymizedUserId: event.anonymizedUserId,
                hashOfPayload: event.hashOfPayload
            },
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            verified: false,
            error: error.message
        });
    }
});

// POST /api/verify/batch - Batch verification
router.post('/batch', (req, res) => {
    try {
        const { eventIds } = req.body;

        if (!Array.isArray(eventIds)) {
            return res.status(400).json({
                error: 'eventIds must be an array'
            });
        }

        const results = eventIds.map(eventId => {
            const event = blockchain.readEvent(eventId);
            if (!event) {
                return {
                    eventId,
                    verified: false,
                    error: 'Event not found'
                };
            }

            const block = blockchain.chain.find(b => b.index === event.blockIndex);
            const blockValid = block ? verifyBlockIntegrity(block) : false;

            return {
                eventId,
                verified: blockValid,
                blockIndex: event.blockIndex,
                timestamp: event.timestamp
            };
        });

        const totalVerified = results.filter(r => r.verified).length;

        res.json({
            success: true,
            totalRequested: eventIds.length,
            totalVerified,
            totalFailed: eventIds.length - totalVerified,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/verify/chain/integrity - Verify entire blockchain integrity
router.get('/chain/integrity', (req, res) => {
    try {
        const results = [];
        let isValid = true;

        for (let i = 1; i < blockchain.chain.length; i++) {
            const currentBlock = blockchain.chain[i];
            const previousBlock = blockchain.chain[i - 1];

            const blockHashValid = verifyBlockIntegrity(currentBlock);
            const linkageValid = currentBlock.previousHash === previousBlock.hash;

            const blockStatus = {
                index: currentBlock.index,
                blockHashValid,
                linkageValid,
                timestamp: currentBlock.timestamp
            };

            if (!blockHashValid || !linkageValid) {
                isValid = false;
                blockStatus.error = !blockHashValid
                    ? 'Block hash mismatch'
                    : 'Previous hash linkage broken';
            }

            results.push(blockStatus);
        }

        res.json({
            verified: isValid,
            totalBlocks: blockchain.chain.length,
            blocksVerified: blockchain.chain.length - 1, // Exclude genesis
            chainIntegrity: isValid ? 'VALID' : 'CORRUPTED',
            results,
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            verified: false,
            error: error.message
        });
    }
});

// GET /api/verify/user/:userId - Verify all events for a user
router.get('/user/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const events = blockchain.queryAllEvents()
            .filter(e => e.anonymizedUserId === userId);

        if (events.length === 0) {
            return res.status(404).json({
                error: 'No events found for this user',
                userId
            });
        }

        const verificationResults = events.map(event => {
            const block = blockchain.chain.find(b => b.index === event.blockIndex);
            const blockValid = block ? verifyBlockIntegrity(block) : false;

            return {
                eventId: event.eventId,
                eventType: event.eventType,
                timestamp: event.timestamp,
                verified: blockValid,
                blockIndex: event.blockIndex
            };
        });

        const allValid = verificationResults.every(r => r.verified);

        res.json({
            userId,
            verified: allValid,
            totalEvents: events.length,
            verifiedEvents: verificationResults.filter(r => r.verified).length,
            events: verificationResults,
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            verified: false,
            error: error.message
        });
    }
});

// POST /api/verify/hash - Verify payload hash matches expected
router.post('/hash', (req, res) => {
    try {
        const { eventId, expectedHash } = req.body;

        if (!eventId || !expectedHash) {
            return res.status(400).json({
                error: 'eventId and expectedHash required'
            });
        }

        const event = blockchain.readEvent(eventId);

        if (!event) {
            return res.status(404).json({
                verified: false,
                error: 'Event not found'
            });
        }

        const hashMatches = event.hashOfPayload === expectedHash;

        res.json({
            verified: hashMatches,
            eventId,
            storedHash: event.hashOfPayload,
            expectedHash,
            match: hashMatches,
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            verified: false,
            error: error.message
        });
    }
});

// GET /api/verify/report - Generate verification report
router.get('/report', (req, res) => {
    try {
        const events = blockchain.queryAllEvents();
        const chainInfo = blockchain.getChainInfo();

        let eventVerifications = 0;
        let blockVerifications = 0;

        events.forEach(event => {
            const block = blockchain.chain.find(b => b.index === event.blockIndex);
            if (block && verifyBlockIntegrity(block)) {
                eventVerifications++;
            }
        });

        for (let i = 1; i < blockchain.chain.length; i++) {
            if (verifyBlockIntegrity(blockchain.chain[i])) {
                blockVerifications++;
            }
        }

        const chainValid = verifyChainUpToBlock(blockchain.chain.length - 1);

        res.json({
            report: {
                title: 'TaxGuard Blockchain Integrity Report',
                generatedAt: new Date().toISOString(),
                blockchain: {
                    totalBlocks: chainInfo.length,
                    verifiedBlocks: blockVerifications,
                    chainIntegrity: chainValid ? 'VALID' : 'COMPROMISED'
                },
                events: {
                    totalEvents: events.length,
                    verifiedEvents: eventVerifications,
                    integrityRate: ((eventVerifications / events.length) * 100).toFixed(2) + '%'
                },
                summary: {
                    overallStatus: chainValid && eventVerifications === events.length
                        ? 'FULLY VERIFIED'
                        : 'VERIFICATION ISSUES DETECTED',
                    lastVerification: new Date().toISOString(),
                    reportVersion: '1.0.0'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function calculateIntegrityHash(eventId, eventType, anonymizedUserId, hashOfPayload) {
    const data = `${eventId}${eventType}${anonymizedUserId}${hashOfPayload}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

function verifyBlockIntegrity(block) {
    const { index, timestamp, data, previousHash } = block;
    const blockData = JSON.stringify(data);
    const calculatedHash = crypto
        .createHash('sha256')
        .update(index + timestamp + blockData + previousHash)
        .digest('hex');

    return calculatedHash === block.hash;
}

function verifyChainUpToBlock(blockIndex) {
    for (let i = 1; i <= blockIndex && i < blockchain.chain.length; i++) {
        const currentBlock = blockchain.chain[i];
        const previousBlock = blockchain.chain[i - 1];

        if (!verifyBlockIntegrity(currentBlock)) {
            return false;
        }

        if (currentBlock.previousHash !== previousBlock.hash) {
            return false;
        }
    }
    return true;
}

module.exports = router;
