// Mock fabric-shim for testing
class ChaincodeStub {
    constructor() {
        this.putState = jest.fn();
        this.getState = jest.fn();
        this.getStateByRange = jest.fn();
        this.getQueryResult = jest.fn();
        this.getHistoryForKey = jest.fn();
        this.setEvent = jest.fn();
        this.getTxID = jest.fn();
    }
}

class ClientIdentity {
    constructor() {
        this.getID = jest.fn();
        this.getAttributeValue = jest.fn();
    }
}

module.exports = {
    ChaincodeStub,
    ClientIdentity
};
