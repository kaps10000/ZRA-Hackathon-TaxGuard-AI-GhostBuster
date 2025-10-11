# WhistlePro Backend - Database Schema

Complete PostgreSQL schema for the WhistlePro anonymous reporting system.

---

## Table of Contents
1. [Reports Table](#reports-table)
2. [Investigators Table](#investigators-table)
3. [Audit Logs Table](#audit-logs-table)
4. [OCR Documents Table](#ocr-documents-table) (Bonus Integration)

---

## Reports Table

**Purpose:** Stores encrypted whistleblower reports with case tracking

```sql
CREATE TABLE public.reports (
    id                  integer NOT NULL PRIMARY KEY,
    case_id             character varying(20) NOT NULL UNIQUE,
    payload_encrypted   text NOT NULL,
    category            character varying(50),
    status              text DEFAULT 'pending'::text,
    priority            text DEFAULT 'medium'::text,
    metadata_hash       text,
    created_at          timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT reports_status_check
        CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'investigating'::text, 'closed'::text])),
    CONSTRAINT reports_priority_check
        CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))
);

-- Indexes for performance
CREATE INDEX reports_case_id_index ON public.reports (case_id);
CREATE INDEX reports_status_index ON public.reports (status);
CREATE INDEX reports_created_at_index ON public.reports (created_at);
CREATE INDEX reports_status_created_at_index ON public.reports (status, created_at);
CREATE INDEX reports_category_status_index ON public.reports (category, status);
```

### Column Descriptions:
- **id**: Auto-incrementing primary key
- **case_id**: Unique identifier (format: `ZRA-YYYY-XXXXXX`)
- **payload_encrypted**: AES-256-GCM encrypted report data
- **category**: Type of report (tax_evasion, fraud, corruption, etc.)
- **status**: Current investigation status
- **priority**: Urgency level
- **metadata_hash**: SHA-256 hash for blockchain integration
- **created_at**: Report submission timestamp
- **updated_at**: Last modification timestamp

---

## Investigators Table

**Purpose:** Stores investigator accounts with role-based access control

```sql
CREATE TABLE public.investigators (
    id              integer NOT NULL PRIMARY KEY,
    email           character varying(255) NOT NULL UNIQUE,
    password_hash   character varying(255) NOT NULL,
    full_name       character varying(255) NOT NULL,
    badge_number    character varying(50) UNIQUE,
    role            text DEFAULT 'investigator'::text,
    department      text DEFAULT 'general'::text,
    is_active       boolean DEFAULT true NOT NULL,
    last_login      timestamp with time zone,
    created_at      timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT investigators_role_check
        CHECK (role = ANY (ARRAY['investigator'::text, 'senior_investigator'::text, 'supervisor'::text, 'admin'::text])),
    CONSTRAINT investigators_department_check
        CHECK (department = ANY (ARRAY['tax_evasion'::text, 'fraud'::text, 'compliance'::text, 'general'::text]))
);

-- Indexes for authentication and access control
CREATE INDEX investigators_role_index ON public.investigators (role);
CREATE INDEX investigators_is_active_index ON public.investigators (is_active);
CREATE INDEX investigators_email_is_active_index ON public.investigators (email, is_active);
CREATE INDEX investigators_role_is_active_index ON public.investigators (role, is_active);
```

### Column Descriptions:
- **id**: Auto-incrementing primary key
- **email**: Unique email for login
- **password_hash**: BCrypt hashed password (12 rounds)
- **full_name**: Investigator's full name
- **badge_number**: Unique ZRA badge identifier
- **role**: Access level (investigator, senior_investigator, supervisor, admin)
- **department**: Specialization area
- **is_active**: Account status flag
- **last_login**: Last successful login timestamp
- **created_at**: Account creation timestamp
- **updated_at**: Last modification timestamp

---

## Audit Logs Table

**Purpose:** Immutable audit trail for compliance and security monitoring

```sql
CREATE TABLE public.audit_logs (
    id                integer NOT NULL PRIMARY KEY,
    actor_id          integer,
    actor_type        character varying(50) NOT NULL,
    action            character varying(100) NOT NULL,
    target_type       character varying(50) NOT NULL,
    target_id         integer,
    ip_hash           character varying(64),
    user_agent_hash   text,
    metadata          json,
    created_at        timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT audit_logs_actor_id_foreign
        FOREIGN KEY (actor_id) REFERENCES public.investigators(id) ON DELETE SET NULL
);

-- Indexes for audit queries
CREATE INDEX audit_logs_actor_id_created_at_index ON public.audit_logs (actor_id, created_at);
CREATE INDEX audit_logs_action_created_at_index ON public.audit_logs (action, created_at);
CREATE INDEX audit_logs_target_type_target_id_index ON public.audit_logs (target_type, target_id);
CREATE INDEX audit_logs_created_at_index ON public.audit_logs (created_at);
```

### Column Descriptions:
- **id**: Auto-incrementing primary key
- **actor_id**: Investigator ID (null for anonymous actions)
- **actor_type**: Type of actor (investigator, anonymous, system)
- **action**: Action performed (report_created, report_viewed, status_changed, etc.)
- **target_type**: Type of entity affected (report, investigator, etc.)
- **target_id**: ID of affected entity
- **ip_hash**: SHA-256 hashed IP address for privacy
- **user_agent_hash**: Hashed user agent string
- **metadata**: Additional contextual data in JSON format
- **created_at**: Event timestamp

---

## OCR Documents Table (Bonus Integration)

**Purpose:** Stores OCR-processed documents with AI verification and blockchain proof

```sql
CREATE TYPE ocr.document_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'VERIFIED',
    'FLAGGED',
    'ERROR'
);

CREATE TYPE ocr.verification_status_type AS ENUM (
    'VALID',
    'SUSPICIOUS',
    'FRAUDULENT',
    'INVALID'
);

CREATE TABLE ocr.documents (
    id                    integer NOT NULL PRIMARY KEY,
    document_id           character varying(100) NOT NULL UNIQUE,
    filename              character varying(255) NOT NULL,
    original_name         character varying(255) NOT NULL,
    file_path             character varying(500) NOT NULL,
    file_size             bigint NOT NULL,
    mime_type             character varying(100) NOT NULL,
    file_hash             character varying(64) NOT NULL,
    uploaded_at           timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    uploaded_by           character varying(100) DEFAULT 'anonymous'::character varying,
    status                ocr.document_status DEFAULT 'PENDING'::ocr.document_status,
    metadata              jsonb DEFAULT '{}'::jsonb,
    ocr_data              jsonb,
    ai_metadata           jsonb,
    risk_score            numeric(5,2),
    verification_status   ocr.verification_status_type,
    risk_flags            jsonb DEFAULT '[]'::jsonb,
    verification_result   jsonb,
    blockchain_tx_id      character varying(100),
    block_number          integer,
    blockchain_proof      jsonb,
    processing_steps      jsonb DEFAULT '[]'::jsonb,
    error_logs            jsonb DEFAULT '[]'::jsonb,
    processed_at          timestamp with time zone,
    verified_at           timestamp with time zone,
    last_updated          timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at            timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at            timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for OCR document queries
CREATE INDEX documents_document_id_index ON ocr.documents (document_id);
CREATE INDEX documents_file_hash_index ON ocr.documents (file_hash);
CREATE INDEX documents_status_index ON ocr.documents (status);
CREATE INDEX documents_status_uploaded_at_index ON ocr.documents (status, uploaded_at);
CREATE INDEX documents_verification_status_index ON ocr.documents (verification_status);
CREATE INDEX documents_verification_status_uploaded_at_index ON ocr.documents (verification_status, uploaded_at);
CREATE INDEX documents_blockchain_tx_id_index ON ocr.documents (blockchain_tx_id);
```

---

## Schema Relationships

```
investigators (1) ──< (N) audit_logs
     │
     └─> Actor performing actions on reports

reports (1) ──< (N) audit_logs
     │
     └─> Target of investigator actions

ocr.documents
     │
     └─> Independent table for document processing (can be linked to reports via metadata)
```

---

## Key Features

### 1. **Security**
- Encrypted report payloads (AES-256-GCM)
- Hashed IP addresses and user agents for anonymity
- BCrypt password hashing (12 rounds)
- SHA-256 file hashing for document integrity

### 2. **Performance**
- Composite indexes on frequently queried columns
- Strategic indexes for time-based queries
- Status-based filtering optimization

### 3. **Compliance**
- Immutable audit trail
- Foreign key constraints with proper cascade rules
- Check constraints for data integrity

### 4. **Blockchain Ready**
- `metadata_hash` in reports table
- `blockchain_tx_id` and `blockchain_proof` in documents table
- Supports future integration with Hyperledger Fabric

---

## Sample Data

### Creating an Investigator:
```sql
INSERT INTO public.investigators (
    email,
    password_hash,
    full_name,
    badge_number,
    role,
    department
) VALUES (
    'investigator@zra.gov.zm',
    '$2a$12$hashed_password_here',
    'John Mwamba',
    'ZRA-INV-001',
    'investigator',
    'tax_evasion'
);
```

### Creating a Report:
```sql
INSERT INTO public.reports (
    case_id,
    payload_encrypted,
    category,
    status,
    priority,
    metadata_hash
) VALUES (
    'ZRA-2025-A1B2C3',
    'encrypted_payload_here',
    'tax_evasion',
    'pending',
    'high',
    'sha256_hash_here'
);
```

### Logging an Audit Event:
```sql
INSERT INTO public.audit_logs (
    actor_id,
    actor_type,
    action,
    target_type,
    target_id,
    ip_hash,
    metadata
) VALUES (
    1,
    'investigator',
    'report_viewed',
    'report',
    1,
    'sha256_hashed_ip',
    '{"case_id": "ZRA-2025-A1B2C3"}'::json
);
```

---

## Migration Files

All schemas are created using Knex.js migrations located in:
- `database/migrations/20231003000001_create_reports.js`
- `database/migrations/20231003000002_create_investigators.js`
- `database/migrations/20231003000003_create_audit_logs.js`
- `database/migrations/20251006000001_create_ocr_documents.js`
- `database/migrations/20251006000002_create_additional_schemas.js`

To run migrations:
```bash
npm run migrate
```

To rollback:
```bash
npm run migrate:rollback
```

---

**Generated by:** Kelvin - WhistlePro Backend Developer
**Project:** ZRA Hackathon 2025 - TaxGuard AI
**Last Updated:** October 11, 2025
