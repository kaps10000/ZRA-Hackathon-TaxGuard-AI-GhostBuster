const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TaxGuard Blockchain API',
            version: '1.0.0',
            description: 'Blockchain API for TaxGuard AI - Immutable tax event recording system',
            contact: {
                name: 'Kaps (Dev 4)',
                email: 'blockchain@taxguard.ai'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                TaxEvent: {
                    type: 'object',
                    required: ['eventType', 'anonymizedUserId', 'hashOfPayload'],
                    properties: {
                        eventType: {
                            type: 'string',
                            enum: ['filing', 'payment', 'auditFlag', 'adminChange', 'compliance', 'whistleblower'],
                            description: 'Type of tax event'
                        },
                        anonymizedUserId: {
                            type: 'string',
                            description: 'Anonymized user identifier'
                        },
                        hashOfPayload: {
                            type: 'string',
                            pattern: '^[a-fA-F0-9]+$',
                            description: 'SHA256 hash of the event payload'
                        },
                        notes: {
                            type: 'string',
                            maxLength: 1000,
                            description: 'Additional event details'
                        }
                    }
                },
                BlockchainEvent: {
                    type: 'object',
                    properties: {
                        eventId: { type: 'string' },
                        eventType: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        anonymizedUserId: { type: 'string' },
                        hashOfPayload: { type: 'string' },
                        notes: { type: 'string' },
                        blockIndex: { type: 'integer' }
                    }
                }
            }
        }
    },
    apis: ['./api/index.js', './api/monitoring.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    specs
};
