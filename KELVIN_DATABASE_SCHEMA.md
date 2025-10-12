# 🗄️ Kelvin's WhistlePro Database Schema

**Developer:** Kelvin (Dev 3)  
**Module:** WhistlePro Backend  
**Database:** PostgreSQL  
**ORM:** Knex.js  
**Date:** October 6, 2025

---

## 📊 Database Overview

**Database Name:** `whistlepro_db` (PostgreSQL)  
**Tables:** 3 main tables with relationships  
**Migration System:** Knex.js migrations  
**Security:** End-to-end encryption, audit trails, hashed data

---

## 🏗️ Table Schemas

### **1. `reports` Table**

**Purpose:** Store encrypted whistleblower reports with case management

```sql
CREATE TABLE reports (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Case Management
    case_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Encrypted Data
    payload_encrypted TEXT NOT NULL,
    
    -- Classification
    category VARCHAR(50),
    status ENUM('pending', 'under_review', 'investigating', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Blockchain Integration
    metadata_hash TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for Performance
CREATE INDEX idx_reports_case_id ON reports(case_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_status_created ON reports(status, created_at);
CREATE INDEX idx_reports_category_status ON reports(category, status);
```

**Field Details:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `case_id` | VARCHAR(20) | Unique case identifier (e.g., "WP-2025-001234") |
| `payload_encrypted` | TEXT | End-to-end encrypted report content |
| `category` | VARCHAR(50) | Report category (tax_evasion, fraud, etc.) |
| `status` | ENUM | Current investigation status |
| `priority` | ENUM | Investigation priority level |
| `metadata_hash` | TEXT | Hash for blockchain verification |
| `created_at` | TIMESTAMP | When report was submitted |
| `updated_at` | TIMESTAMP | Last modification time |

---

### **2. `investigators` Table**

**Purpose:** Manage investigator accounts and access control

```sql
CREATE TABLE investigators (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Info
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    
    -- Role & Department
    role ENUM('investigator', 'senior_investigator', 'supervisor', 'admin') DEFAULT 'investigator',
    department ENUM('tax_evasion', 'fraud', 'compliance', 'general') DEFAULT 'general',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Activity Tracking
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for Performance
CREATE INDEX idx_investigators_email ON investigators(email);
CREATE INDEX idx_investigators_badge ON investigators(badge_number);
CREATE INDEX idx_investigators_email_active ON investigators(email, is_active);
CREATE INDEX idx_investigators_role_active ON investigators(role, is_active);
```

**Field Details:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `email` | VARCHAR(255) | Unique login email |
| `password_hash` | VARCHAR(255) | Bcrypt hashed password |
| `full_name` | VARCHAR(255) | Investigator's full name |
| `badge_number` | VARCHAR(50) | Unique badge/employee ID |
| `role` | ENUM | Access level and permissions |
| `department` | ENUM | Specialized investigation area |
| `is_active` | BOOLEAN | Account status (active/disabled) |
| `last_login` | TIMESTAMP | Last successful login |
| `created_at` | TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | Last profile update |

---

### **3. `audit_logs` Table**

**Purpose:** Complete audit trail for security and compliance

```sql
CREATE TABLE audit_logs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Actor Information
    actor_id INTEGER,
    actor_type VARCHAR(50) NOT NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    
    -- Security Data (Hashed)
    ip_hash VARCHAR(64),
    user_agent_hash TEXT,
    
    -- Additional Context
    metadata JSON,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Foreign Key Constraints
    FOREIGN KEY (actor_id) REFERENCES investigators(id) ON DELETE SET NULL
);

-- Indexes for Audit Queries
CREATE INDEX idx_audit_actor_created ON audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_action_created ON audit_logs(action, created_at);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

**Field Details:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `actor_id` | INTEGER | Who performed the action (NULL for anonymous) |
| `actor_type` | VARCHAR(50) | Type: investigator, anonymous, system |
| `action` | VARCHAR(100) | What happened (report_created, status_changed, etc.) |
| `target_type` | VARCHAR(50) | What was acted upon (report, investigator, etc.) |
| `target_id` | INTEGER | ID of the target object |
| `ip_hash` | VARCHAR(64) | SHA-256 hash of IP address |
| `user_agent_hash` | TEXT | Hashed browser/client info |
| `metadata` | JSON | Additional context data |
| `created_at` | TIMESTAMP | When the action occurred |

---

## 🔗 Table Relationships

```
investigators (1) ←→ (N) audit_logs
    ↓
    Foreign Key: audit_logs.actor_id → investigators.id
    
reports (1) ←→ (N) audit_logs (via target_type/target_id)
    ↓
    Logical relationship for report actions
```

---

## 📋 Sample Data Structures

### **Sample Report Record:**
```json
{
  "id": 1,
  "case_id": "WP-2025-001234",
  "payload_encrypted": "eyJhbGciOiJSU0EtT0FFUC0yNTYi...",
  "category": "tax_evasion",
  "status": "under_review",
  "priority": "high",
  "metadata_hash": "0x8f7e2b1a9c4d5e6f...",
  "created_at": "2025-10-06T15:30:00Z",
  "updated_at": "2025-10-06T16:45:00Z"
}
```

### **Sample Investigator Record:**
```json
{
  "id": 1,
  "email": "investigator@zra.gov.zm",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjWZifZTy",
  "full_name": "John Mwanza",
  "badge_number": "ZRA-INV-001",
  "role": "senior_investigator",
  "department": "tax_evasion",
  "is_active": true,
  "last_login": "2025-10-06T14:30:00Z",
  "created_at": "2025-10-01T09:00:00Z",
  "updated_at": "2025-10-06T14:30:00Z"
}
```

### **Sample Audit Log Record:**
```json
{
  "id": 1,
  "actor_id": 1,
  "actor_type": "investigator",
  "action": "report_status_changed",
  "target_type": "report",
  "target_id": 1,
  "ip_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "user_agent_hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
  "metadata": {
    "old_status": "pending",
    "new_status": "under_review",
    "reason": "Initial review assigned"
  },
  "created_at": "2025-10-06T16:45:00Z"
}
```

---

## 🔍 Common Queries

### **Find Active Cases by Status:**
```sql
SELECT case_id, category, priority, created_at 
FROM reports 
WHERE status = 'under_review' 
ORDER BY priority DESC, created_at ASC;
```

### **Get Investigator Workload:**
```sql
SELECT 
    i.full_name,
    i.department,
    COUNT(al.id) as actions_today
FROM investigators i
LEFT JOIN audit_logs al ON i.id = al.actor_id 
    AND al.created_at >= CURRENT_DATE
WHERE i.is_active = true
GROUP BY i.id, i.full_name, i.department
ORDER BY actions_today DESC;
```

### **Audit Trail for Specific Report:**
```sql
SELECT 
    al.action,
    al.actor_type,
    i.full_name as actor_name,
    al.metadata,
    al.created_at
FROM audit_logs al
LEFT JOIN investigators i ON al.actor_id = i.id
WHERE al.target_type = 'report' 
    AND al.target_id = 1
ORDER BY al.created_at DESC;
```

### **High Priority Cases:**
```sql
SELECT 
    case_id,
    category,
    status,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM reports 
WHERE priority IN ('high', 'critical')
    AND status != 'closed'
ORDER BY priority DESC, created_at ASC;
```

---

## 🛡️ Security Features

### **1. Data Encryption:**
- **Report Payloads:** End-to-end encrypted using node-jose
- **Passwords:** Bcrypt hashed with salt rounds
- **IP Addresses:** SHA-256 hashed for privacy
- **User Agents:** Hashed to prevent fingerprinting

### **2. Access Control:**
- **Role-based permissions** (investigator → admin hierarchy)
- **Department-based access** to relevant cases
- **Active status checking** for all operations

### **3. Audit Trail:**
- **Complete action logging** for compliance
- **Anonymous action support** for whistleblower protection
- **Metadata preservation** for investigation context
- **Time-based queries** for forensic analysis

---

## 🚀 Database Setup Commands

### **1. Install Dependencies:**
```bash
cd whistlepro_backend
npm install
```

### **2. Configure Database:**
```bash
# Copy environment template
cp .env.example .env

# Edit database credentials
nano .env
```

### **3. Run Migrations:**
```bash
# Create all tables
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

### **4. Start Application:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 📊 Performance Considerations

### **Indexing Strategy:**
- ✅ **Primary Keys:** Automatic B-tree indexes
- ✅ **Foreign Keys:** Indexed for JOIN performance
- ✅ **Status Fields:** For filtering queries
- ✅ **Timestamp Fields:** For time-based queries
- ✅ **Composite Indexes:** For common query patterns

### **Query Optimization:**
- **Case ID lookups:** O(log n) via unique index
- **Status filtering:** Optimized with enum indexes
- **Audit queries:** Time-based partitioning ready
- **Role-based access:** Efficient permission checking

---

## ✅ Summary

**Kelvin's Database Implementation:**
- ✅ **3 Production Tables:** reports, investigators, audit_logs
- ✅ **Complete Security:** Encryption, hashing, audit trails
- ✅ **Performance Optimized:** Proper indexing strategy
- ✅ **Blockchain Ready:** Metadata hash integration
- ✅ **Compliance Ready:** Full audit trail system
- ✅ **Migration System:** Knex.js for version control
- ✅ **Role-Based Access:** Multi-level permissions

**Database Status: Production Ready** 🎯

**Location:** `/home/kaps100/ZRA-Hackathon-TaxGuard-AI-GhostBuster/whistlepro_backend/`
