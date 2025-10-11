// Mock fabric-contract-api for testing
class Contract {
    constructor(name) {
        this.name = name;
    }
}

class Context {
    constructor() {
        this.stub = null;
        this.clientIdentity = null;
    }
}

module.exports = {
    Contract,
    Context
};
