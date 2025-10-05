# 🏗️ OCR Verification Blockchain - System Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ZRA OCR Verification System                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌──────────────┐      ┌────────────────────┐
│  Frontend   │      │   Backend    │      │    Blockchain      │
│  (Dev 4)    │─────▶│   (Dev 2)    │─────▶│    (Dev 3)         │
│             │      │              │      │                    │
│ - Upload UI │      │ - API Routes │      │ - Smart Contracts  │
│ - Dashboard │      │ - File Store │      │ - Proof Storage    │
│ - Results   │      │ - AI Bridge  │      │ - Verification     │
└─────────────┘      └──────────────┘      └────────────────────┘
                              │
                              ▼
                     ┌──────────────┐
                     │   AI/OCR     │
                     │   (Dev 1)    │
                     │              │
                     │ - Tesseract  │
                     │ - NLP/Regex  │
                     │ - Risk Score │
                     └──────────────┘
```

## 🔗 Blockchain Layer Architecture

### Network Configuration

```
┌────────────────────────────────────────────────────┐
│              Blockchain Networks                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  1. Hardhat Network (Development)                  │
│     - Chain ID: 1337                               │
│     - Built-in test accounts                       │
│     - Fast mining                                  │
│                                                     │
│  2. Ganache Network (Testing)                      │
│     - URL: http://127.0.0.1:8545                   │
│     - GUI/CLI blockchain simulator                 │
│     - Custom account configuration                 │
│                                                     │
│  3. Localhost (Manual Testing)                     │
│     - Connect external tools                       │
│     - MetaMask integration                         │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Account Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Account Hierarchy                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 ZRA Officer (Primary)                                   │
│     Address: 0xf39F...2266                                  │
│     Role: Document verification & approval                   │
│     Permissions: Write, Approve                              │
│                                                              │
│  🔍 Auditor                                                 │
│     Address: 0x7099...79C8                                  │
│     Role: System audit & compliance                          │
│     Permissions: Read, Query                                 │
│                                                              │
│  👨‍💻 Developer                                               │
│     Address: 0x3C44...93BC                                  │
│     Role: Testing & development                              │
│     Permissions: Deploy, Test                                │
│                                                              │
│  ⚙️ Admin                                                    │
│     Address: 0x90F7...b906                                  │
│     Role: System administration                              │
│     Permissions: Configure, Manage                           │
│                                                              │
│  🧪 Test Users (x2)                                         │
│     Addresses: 0x15d3...6A65, 0x9965...A4dc                 │
│     Role: General testing                                    │
│     Permissions: Basic operations                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Smart Contract Architecture

### Current Implementation (Task 1)

```solidity
┌─────────────────────────────────────┐
│      HelloBlockchain.sol             │
├─────────────────────────────────────┤
│                                      │
│  State Variables:                    │
│  - string message                    │
│  - address owner                     │
│  - uint256 deploymentTime           │
│                                      │
│  Functions:                          │
│  - getMessage()                      │
│  - setMessage(string)               │
│  - getInfo()                        │
│                                      │
│  Events:                             │
│  - MessageUpdated                    │
│  - ContractDeployed                  │
│                                      │
└─────────────────────────────────────┘
```

### Future Implementation (Task 2)

```solidity
┌─────────────────────────────────────────────────────┐
│          DocumentVerification.sol                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Structs:                                            │
│  - VerificationData {                                │
│      bytes32 docHash                                 │
│      string result                                   │
│      uint256 riskScore                              │
│      address verifier                                │
│      uint256 timestamp                              │
│      string metadata                                 │
│    }                                                 │
│                                                      │
│  Core Functions:                                     │
│  - storeProof(docHash, result, metadata)            │
│  - getProof(docHash)                                │
│  - flagDocument(docHash, reason)                    │
│  - batchVerify(docHashes[])                         │
│                                                      │
│  Access Control:                                     │
│  - onlyOfficer modifier                              │
│  - onlyAuditor modifier                              │
│  - onlyAdmin modifier                                │
│                                                      │
│  Events:                                             │
│  - ProofStored(docHash, verifier, timestamp)        │
│  - DocumentFlagged(docHash, reason)                 │
│  - BatchVerified(count, timestamp)                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Document Verification Flow

```
1. Document Upload (Frontend → Backend)
   ┌────────────┐
   │  User      │
   │  Uploads   │
   │  Document  │
   └──────┬─────┘
          │
          ▼
   ┌────────────┐
   │  Backend   │
   │  Stores    │
   │  File      │
   └──────┬─────┘

2. AI Processing (Backend → AI Service)
          │
          ▼
   ┌────────────┐
   │  AI/OCR    │
   │  Extracts  │
   │  Data      │
   └──────┬─────┘
          │
          ▼
   ┌────────────┐
   │  Generate  │
   │  Risk      │
   │  Score     │
   └──────┬─────┘

3. Blockchain Storage (Backend → Blockchain)
          │
          ▼
   ┌────────────────────┐
   │  Hash Document     │
   │  SHA-256(data)     │
   └──────┬─────────────┘
          │
          ▼
   ┌────────────────────┐
   │  Smart Contract    │
   │  storeProof()      │
   └──────┬─────────────┘
          │
          ▼
   ┌────────────────────┐
   │  Emit Event        │
   │  ProofStored       │
   └──────┬─────────────┘

4. Verification Response (Blockchain → Frontend)
          │
          ▼
   ┌────────────────────┐
   │  Return TX ID      │
   │  & Proof Data      │
   └──────┬─────────────┘
          │
          ▼
   ┌────────────────────┐
   │  Display Results   │
   │  + Blockchain Link │
   └────────────────────┘
```

## 🔐 Security Architecture

### Layer 1: Environment Security
```
.env file protection
   │
   ├─ Git ignored
   ├─ No private keys in code
   └─ Separate .env.example template
```

### Layer 2: Network Security
```
Local blockchain isolation
   │
   ├─ No mainnet connection
   ├─ Test-only accounts
   └─ Gas limit protection
```

### Layer 3: Contract Security
```
Smart contract access control
   │
   ├─ Owner-based permissions
   ├─ Role-based access (RBAC)
   └─ Function modifiers
```

### Layer 4: Data Security
```
Document verification
   │
   ├─ SHA-256 hashing
   ├─ Immutable storage
   └─ Event logging
```

## 📡 API Integration Points

### Backend ↔ Blockchain

```javascript
// Example: Store verification proof
POST /api/blockchain/store-proof
{
  "docHash": "0x1234...",
  "verificationResult": "VALID",
  "riskScore": 15,
  "metadata": {
    "invoiceNumber": "INV-2025-001",
    "importerName": "ABC Corp",
    "hsCode": "8471.30"
  }
}

Response:
{
  "success": true,
  "transactionId": "0xabcd...",
  "blockNumber": 12345,
  "timestamp": 1728155431
}

// Example: Retrieve proof
GET /api/blockchain/get-proof/:docHash

Response:
{
  "docHash": "0x1234...",
  "result": "VALID",
  "riskScore": 15,
  "verifier": "0xf39F...2266",
  "timestamp": 1728155431,
  "blockNumber": 12345
}
```

## 📊 Technology Stack

```
┌────────────────────────────────────────┐
│         Blockchain Stack                │
├────────────────────────────────────────┤
│                                         │
│  Smart Contracts                        │
│  └─ Solidity 0.8.19                    │
│                                         │
│  Development Framework                  │
│  └─ Hardhat 2.26.3                     │
│                                         │
│  Blockchain Library                     │
│  └─ Ethers.js 6.15.0                   │
│                                         │
│  Local Blockchain                       │
│  ├─ Hardhat Network                     │
│  └─ Ganache 7.9.2                      │
│                                         │
│  Testing & Tools                        │
│  ├─ Hardhat Toolbox                     │
│  ├─ Chai (assertions)                   │
│  └─ Gas Reporter                        │
│                                         │
│  Environment                            │
│  └─ Dotenv                              │
│                                         │
└────────────────────────────────────────┘
```

## 🎯 Deployment Architecture

### Development Environment
```
Developer Machine
   │
   ├─ Hardhat Network (In-memory)
   ├─ Local Ganache (Persistent)
   └─ Test Scripts
```

### Testing Environment
```
Test Server
   │
   ├─ Ganache CLI
   ├─ Automated Tests
   └─ CI/CD Integration
```

### Production Environment (Future)
```
Cloud Infrastructure
   │
   ├─ Ethereum Testnet (Sepolia/Goerli)
   ├─ Private Consortium Chain
   └─ Load Balancer
```

## 📈 Scalability Considerations

### Current Capacity
- **Transactions/sec**: ~1000 (local)
- **Storage**: Unlimited (local)
- **Gas costs**: Free (test network)

### Future Scaling
- Batch verification support
- Off-chain data storage (IPFS)
- Layer 2 solutions (Polygon, Optimism)
- Sharding for high throughput

## 🔧 Configuration Files

```
Project Root
├── hardhat.config.js          # Network & compiler config
├── .env                       # Environment variables (secret)
├── .env.example              # Template
├── package.json              # Dependencies
└── .gitignore                # Security protection

contracts/
└── HelloBlockchain.sol       # Current contract
└── DocumentVerification.sol  # Future contract

scripts/
├── deploy-hello.js           # Deployment
└── generate-test-accounts.js # Account setup

test/
└── [test files]              # Contract tests
```

---

## ✅ Current Status

**Task 1: Environment Setup** - ✅ COMPLETE
- All infrastructure operational
- Test accounts funded
- Contracts deployable
- Documentation complete

**Task 2: Smart Contract Development** - 🔄 NEXT
- DocumentVerification contract
- Integration with backend
- Access control implementation

---

**Last Updated**: October 5, 2025
**Maintained By**: Dev 3 (Blockchain Engineer)
