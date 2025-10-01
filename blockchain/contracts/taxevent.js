'use strict';

const { Contract } = require('fabric-contract-api');

class TaxEventContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async createEvent(ctx, eventId, eventType, timestamp, anonymizedUserId, hashOfPayload, notes) {
        const event = {
            eventId,
            eventType,
            timestamp,
            anonymizedUserId,
            hashOfPayload,
            notes: notes || '',
            docType: 'taxevent'
        };

        await ctx.stub.putState(eventId, Buffer.from(JSON.stringify(event)));
        console.info('============= Event created ===========');
        return JSON.stringify(event);
    }

    async readEvent(ctx, eventId) {
        const eventAsBytes = await ctx.stub.getState(eventId);
        if (!eventAsBytes || eventAsBytes.length === 0) {
            throw new Error(`Event ${eventId} does not exist`);
        }
        console.log(eventAsBytes.toString());
        return eventAsBytes.toString();
    }

    async queryAllEvents(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }
}

module.exports = TaxEventContract;
