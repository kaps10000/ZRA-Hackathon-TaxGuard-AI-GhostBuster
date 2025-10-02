const { Context } = require('fabric-contract-api');
const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const TaxGuardContract = require('../contracts/TaxGuardContract');

// Mock the fabric-contract-api
jest.mock('fabric-contract-api');
jest.mock('fabric-shim');

describe('TaxGuardContract', () => {
    let contract;
    let ctx;
    let stub;
    let clientIdentity;

    beforeEach(() => {
        contract = new TaxGuardContract();
        
        // Mock context
        ctx = new Context();
        stub = new ChaincodeStub();
        clientIdentity = new ClientIdentity();
        
        ctx.stub = stub;
        ctx.clientIdentity = clientIdentity;

        // Setup default mocks
        stub.putState = jest.fn();
        stub.getState = jest.fn();
        stub.getStateByRange = jest.fn();
        stub.getQueryResult = jest.fn();
        stub.getHistoryForKey = jest.fn();
        stub.setEvent = jest.fn();
        stub.getTxID = jest.fn().mockReturnValue('tx123');
        
        clientIdentity.getID = jest.fn().mockReturnValue('user123');
        clientIdentity.getAttributeValue = jest.fn().mockReturnValue('producer');
    });

    describe('initLedger', () => {
        it('should initialize the ledger with default configuration', async () => {
            const result = await contract.initLedger(ctx);
            const config = JSON.parse(result);

            expect(config.contractVersion).toBe('1.0.0');
            expect(config.totalEvents).toBe(0);
            expect(config.supportedEventTypes).toContain('filing');
            expect(stub.putState).toHaveBeenCalledWith('CONFIG', expect.any(Buffer));
        });
    });

    describe('createEvent', () => {
        const validEventData = {
            eventId: 'evt-001',
            eventType: 'filing',
            anonymizedUserId: 'user-123',
            hashOfPayload: 'abc123def456',
            notes: 'Test tax filing'
        };

        beforeEach(() => {
            stub.getState.mockResolvedValue(Buffer.from(''));
            stub.putState.mockResolvedValue();
        });

        it('should create a valid tax event', async () => {
            const result = await contract.createEvent(
                ctx,
                validEventData.eventId,
                validEventData.eventType,
                validEventData.anonymizedUserId,
                validEventData.hashOfPayload,
                validEventData.notes
            );

            const event = JSON.parse(result);
            expect(event.eventId).toBe(validEventData.eventId);
            expect(event.eventType).toBe(validEventData.eventType);
            expect(event.anonymizedUserId).toBe(validEventData.anonymizedUserId);
            expect(event.createdBy).toBe('user123');
            expect(event.integrity).toBeDefined();
            expect(stub.putState).toHaveBeenCalled();
            expect(stub.setEvent).toHaveBeenCalledWith('EventCreated', expect.any(Buffer));
        });

        it('should reject invalid event type', async () => {
            await expect(contract.createEvent(
                ctx,
                'evt-001',
                'invalid-type',
                'user-123',
                'abc123def456',
                'Test'
            )).rejects.toThrow('Invalid event type');
        });

        it('should reject empty event ID', async () => {
            await expect(contract.createEvent(
                ctx,
                '',
                'filing',
                'user-123',
                'abc123def456',
                'Test'
            )).rejects.toThrow('Event ID is required');
        });

        it('should reject invalid hash format', async () => {
            await expect(contract.createEvent(
                ctx,
                'evt-001',
                'filing',
                'user-123',
                'invalid-hash!',
                'Test'
            )).rejects.toThrow('Hash of payload must be a valid hexadecimal string');
        });

        it('should reject duplicate event ID', async () => {
            stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(validEventData)));

            await expect(contract.createEvent(
                ctx,
                validEventData.eventId,
                validEventData.eventType,
                validEventData.anonymizedUserId,
                validEventData.hashOfPayload,
                validEventData.notes
            )).rejects.toThrow('Event evt-001 already exists');
        });

        it('should enforce role-based access control', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('invalid-role');

            await expect(contract.createEvent(
                ctx,
                validEventData.eventId,
                validEventData.eventType,
                validEventData.anonymizedUserId,
                validEventData.hashOfPayload,
                validEventData.notes
            )).rejects.toThrow('Access denied');
        });
    });

    describe('readEvent', () => {
        const mockEvent = {
            eventId: 'evt-001',
            eventType: 'filing',
            anonymizedUserId: 'user-123',
            hashOfPayload: 'abc123def456',
            integrity: 'calculated-hash'
        };

        beforeEach(() => {
            // Mock integrity calculation
            contract._calculateIntegrityHash = jest.fn().mockReturnValue('calculated-hash');
        });

        it('should read an existing event', async () => {
            stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(mockEvent)));

            const result = await contract.readEvent(ctx, 'evt-001');
            const event = JSON.parse(result);

            expect(event.eventId).toBe('evt-001');
            expect(stub.getState).toHaveBeenCalledWith('evt-001');
        });

        it('should throw error for non-existent event', async () => {
            stub.getState.mockResolvedValue(Buffer.from(''));

            await expect(contract.readEvent(ctx, 'non-existent'))
                .rejects.toThrow('Event non-existent not found');
        });

        it('should verify event integrity', async () => {
            const corruptedEvent = { ...mockEvent, integrity: 'wrong-hash' };
            stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(corruptedEvent)));

            await expect(contract.readEvent(ctx, 'evt-001'))
                .rejects.toThrow('Integrity check failed');
        });

        it('should enforce role-based access control', async () => {
            clientIdentity.getAttributeValue.mockReturnValue(null);

            await expect(contract.readEvent(ctx, 'evt-001'))
                .rejects.toThrow('Access denied');
        });
    });

    describe('queryAllEvents', () => {
        beforeEach(() => {
            clientIdentity.getAttributeValue.mockReturnValue('auditor');
        });

        it('should return all events for auditor role', async () => {
            const mockIterator = {
                next: jest.fn()
                    .mockResolvedValueOnce({
                        value: {
                            value: Buffer.from(JSON.stringify({
                                eventId: 'evt-001',
                                eventType: 'filing'
                            }))
                        },
                        done: false
                    })
                    .mockResolvedValueOnce({ done: true }),
                close: jest.fn()
            };

            stub.getStateByRange.mockResolvedValue(mockIterator);

            const result = await contract.queryAllEvents(ctx);
            const events = JSON.parse(result);

            expect(events).toHaveLength(1);
            expect(events[0].eventId).toBe('evt-001');
            expect(mockIterator.close).toHaveBeenCalled();
        });

        it('should deny access for producer role', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('producer');

            await expect(contract.queryAllEvents(ctx))
                .rejects.toThrow('Access denied');
        });
    });

    describe('queryEventsByType', () => {
        beforeEach(() => {
            clientIdentity.getAttributeValue.mockReturnValue('admin');
        });

        it('should query events by type', async () => {
            const mockIterator = {
                next: jest.fn()
                    .mockResolvedValueOnce({
                        value: {
                            value: Buffer.from(JSON.stringify({
                                eventId: 'evt-001',
                                eventType: 'filing'
                            }))
                        },
                        done: false
                    })
                    .mockResolvedValueOnce({ done: true }),
                close: jest.fn()
            };

            stub.getQueryResult.mockResolvedValue(mockIterator);

            const result = await contract.queryEventsByType(ctx, 'filing');
            const events = JSON.parse(result);

            expect(events).toHaveLength(1);
            expect(events[0].eventType).toBe('filing');
        });
    });

    describe('getEventHistory', () => {
        beforeEach(() => {
            clientIdentity.getAttributeValue.mockReturnValue('admin');
        });

        it('should return event history for admin', async () => {
            const mockIterator = {
                next: jest.fn()
                    .mockResolvedValueOnce({
                        value: {
                            tx_id: 'tx123',
                            timestamp: '2025-10-01T10:00:00Z',
                            is_delete: false,
                            value: Buffer.from(JSON.stringify({ eventId: 'evt-001' }))
                        },
                        done: false
                    })
                    .mockResolvedValueOnce({ done: true }),
                close: jest.fn()
            };

            stub.getHistoryForKey.mockResolvedValue(mockIterator);

            const result = await contract.getEventHistory(ctx, 'evt-001');
            const history = JSON.parse(result);

            expect(history).toHaveLength(1);
            expect(history[0].txId).toBe('tx123');
        });

        it('should deny access for non-admin roles', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('auditor');

            await expect(contract.getEventHistory(ctx, 'evt-001'))
                .rejects.toThrow('Access denied');
        });
    });

    describe('Role-based Access Control', () => {
        it('should allow producer to create events', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('producer');
            stub.getState.mockResolvedValue(Buffer.from(''));

            await expect(contract.createEvent(
                ctx, 'evt-001', 'filing', 'user-123', 'abc123def456', 'Test'
            )).resolves.toBeDefined();
        });

        it('should allow admin to create events', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('admin');
            stub.getState.mockResolvedValue(Buffer.from(''));

            await expect(contract.createEvent(
                ctx, 'evt-001', 'filing', 'user-123', 'abc123def456', 'Test'
            )).resolves.toBeDefined();
        });

        it('should allow auditor to read events', async () => {
            clientIdentity.getAttributeValue.mockReturnValue('auditor');
            const mockEvent = {
                eventId: 'evt-001',
                eventType: 'filing',
                anonymizedUserId: 'user-123',
                hashOfPayload: 'abc123def456',
                integrity: 'hash'
            };
            contract._calculateIntegrityHash = jest.fn().mockReturnValue('hash');
            stub.getState.mockResolvedValue(Buffer.from(JSON.stringify(mockEvent)));

            await expect(contract.readEvent(ctx, 'evt-001')).resolves.toBeDefined();
        });
    });
});
