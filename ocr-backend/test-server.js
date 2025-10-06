const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/healthcheck', (req, res) => {
  res.json({
    success: true,
    message: 'ZRA OCR Backend Test Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'zra_admin' && password === 'password') {
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token-12345',
        user: {
          id: 1,
          username: 'zra_admin',
          email: 'admin@zra.gov.zm',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  
  if (token && token.includes('mock-jwt-token')) {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: 1,
          username: 'zra_admin',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

// Document management
app.post('/api/upload', (req, res) => {
  res.json({
    success: true,
    data: {
      documentId: 'DOC-TEST-' + Date.now(),
      filename: 'test-document.pdf',
      status: 'PENDING',
      uploadedAt: new Date().toISOString()
    }
  });
});

app.get('/api/results', (req, res) => {
  res.json({
    success: true,
    data: {
      documents: [
        {
          documentId: 'DOC-TEST-001',
          filename: 'test-invoice.pdf',
          status: 'VERIFIED',
          riskScore: 25.5,
          verificationStatus: 'VALID',
          createdAt: new Date().toISOString()
        },
        {
          documentId: 'DOC-TEST-002',
          filename: 'sample-receipt.pdf',
          status: 'FLAGGED',
          riskScore: 85.2,
          verificationStatus: 'SUSPICIOUS',
          createdAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2
      }
    }
  });
});

app.get('/api/results/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      document: {
        documentId: id,
        filename: 'test-document.pdf',
        status: 'VERIFIED',
        ocrData: {
          extractedText: 'INVOICE\nCompany: ABC Corp\nAmount: $50,000',
          confidence: 0.95
        },
        verificationResult: {
          companyVerification: {
            tpinValid: true,
            companyExists: true,
            status: 'ACTIVE'
          }
        },
        riskScore: 25.5,
        blockchainTxId: 'mock-tx-' + Date.now()
      }
    }
  });
});

// Verification endpoints
app.post('/api/verify/document', (req, res) => {
  const { documentId, extractedData } = req.body;
  
  res.json({
    success: true,
    data: {
      verificationResult: {
        companyVerification: {
          tpinValid: true,
          companyExists: true,
          status: 'ACTIVE'
        },
        documentVerification: {
          formatValid: true,
          amountValid: true
        }
      },
      riskScore: 25.5,
      riskFlags: [],
      verificationStatus: 'VALID',
      document: documentId ? {
        documentId: documentId,
        status: 'VERIFIED',
        verificationStatus: 'VALID',
        blockchainTxId: 'mock-tx-' + Date.now()
      } : null
    }
  });
});

app.post('/api/verify/company', (req, res) => {
  const { tpin, companyName } = req.body;
  
  res.json({
    success: true,
    data: {
      company: {
        tpin: tpin || '1234567890',
        name: companyName || 'ABC Corporation',
        status: 'ACTIVE',
        registrationDate: '2020-01-15'
      },
      verification: {
        tpinValid: true,
        nameMatch: true,
        statusActive: true
      },
      riskScore: 15.0
    }
  });
});

app.post('/api/verify/hscode', (req, res) => {
  const { hsCode, description } = req.body;
  
  res.json({
    success: true,
    data: {
      hsCode: {
        code: hsCode || '8471.30.00',
        description: description || 'Portable automatic data processing machines',
        category: 'Electronics',
        dutyRate: '0%'
      },
      verification: {
        codeValid: true,
        descriptionMatch: true
      },
      riskScore: 10.0
    }
  });
});

// Blockchain endpoints
app.post('/api/blockchain/store-proof', (req, res) => {
  const { documentId, fileHash } = req.body;
  
  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }
  
  res.json({
    success: true,
    data: {
      documentId: documentId,
      transactionId: 'mock-tx-' + Date.now(),
      blockNumber: 12345,
      verificationHash: fileHash || 'sha256:mock-hash',
      timestamp: new Date().toISOString(),
      blockchainUrl: 'http://localhost:3001/explorer'
    }
  });
});

app.get('/api/blockchain/get-proof/:hash', (req, res) => {
  const { hash } = req.params;
  
  res.json({
    success: true,
    data: {
      document: {
        documentId: hash,
        filename: 'test-document.pdf',
        fileHash: 'sha256:' + hash,
        verificationStatus: 'VALID',
        riskScore: 25.5,
        verifiedAt: new Date().toISOString()
      },
      blockchain: {
        transactionId: 'mock-tx-' + Date.now(),
        blockNumber: 12345,
        proof: {
          hash: hash,
          timestamp: new Date().toISOString()
        }
      },
      verification: {
        isValid: true,
        onChain: true,
        confidence: 74.5
      }
    }
  });
});

app.post('/api/blockchain/verify-hash', (req, res) => {
  const { hash, hashType } = req.body;
  
  if (!hash) {
    return res.status(400).json({
      success: false,
      error: 'Hash is required'
    });
  }
  
  res.json({
    success: true,
    data: {
      verified: true,
      document: {
        documentId: hash,
        filename: 'test-document.pdf',
        verificationStatus: 'VALID',
        riskScore: 25.5
      },
      blockchain: {
        onChain: true,
        transactionId: 'mock-tx-' + Date.now(),
        blockNumber: 12345
      }
    }
  });
});

app.post('/api/blockchain/flag-document', (req, res) => {
  const { documentId, reason } = req.body;
  
  if (!documentId || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Document ID and reason are required'
    });
  }
  
  res.json({
    success: true,
    data: {
      documentId: documentId,
      transactionId: 'flag-tx-' + Date.now(),
      timestamp: new Date().toISOString(),
      reason: reason
    }
  });
});

app.get('/api/blockchain/flagged-documents', (req, res) => {
  res.json({
    success: true,
    data: {
      documents: [
        {
          docId: 'SUSPICIOUS-DOC-001',
          reason: 'High risk score detected',
          flaggedAt: new Date().toISOString(),
          transactionId: 'flag-tx-12345'
        }
      ],
      count: 1
    }
  });
});

app.get('/api/blockchain/health', (req, res) => {
  res.json({
    success: true,
    data: {
      blockchain: {
        success: true,
        status: 'healthy',
        chainLength: 12345,
        totalEvents: 100
      },
      integration: {
        apiUrl: 'http://localhost:3001',
        connected: true,
        lastCheck: new Date().toISOString()
      }
    }
  });
});

// Proof endpoints (public)
app.get('/api/proof/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      proof: {
        documentId: id,
        filename: 'test-document.pdf',
        fileHash: 'sha256:' + id,
        blockchainTxId: 'mock-tx-' + Date.now(),
        verificationStatus: 'VALID',
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      verification: {
        isValid: true,
        timestamp: new Date().toISOString(),
        confidence: 74.5
      }
    }
  });
});

app.post('/api/proof/verify', (req, res) => {
  const { txId, fileHash, documentId } = req.body;
  
  res.json({
    success: true,
    data: {
      valid: true,
      document: {
        documentId: documentId || 'TEST-DOC-001',
        verificationStatus: 'VALID',
        riskScore: 25.5
      },
      blockchain: {
        txId: txId || 'mock-tx-12345',
        blockNumber: 12345,
        proof: {
          verified: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ZRA OCR Test API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        verify: 'POST /api/auth/verify'
      },
      documents: {
        upload: 'POST /api/upload',
        results: 'GET /api/results',
        specific: 'GET /api/results/:id'
      },
      verification: {
        document: 'POST /api/verify/document',
        company: 'POST /api/verify/company',
        hscode: 'POST /api/verify/hscode'
      },
      blockchain: {
        store: 'POST /api/blockchain/store-proof',
        get: 'GET /api/blockchain/get-proof/:hash',
        verify: 'POST /api/blockchain/verify-hash',
        flag: 'POST /api/blockchain/flag-document',
        health: 'GET /api/blockchain/health'
      },
      proof: {
        get: 'GET /api/proof/:id',
        verify: 'POST /api/proof/verify'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: '/api'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZRA OCR Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthcheck`);
  console.log(`🌐 API Tester: http://localhost:8080/api-tester.html`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
});
