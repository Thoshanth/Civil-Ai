-- CivilAI Database Schema
-- Version 1.0 - Initial Schema

-- Users table
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255),
    role        VARCHAR(50) DEFAULT 'USER',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Projects (groups work by site/client)
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Uploaded files (stored in MinIO, metadata here)
CREATE TABLE documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name    VARCHAR(500) NOT NULL,
    minio_key    TEXT NOT NULL,
    file_type    VARCHAR(50),
    module       VARCHAR(100),
    file_size_kb INTEGER,
    uploaded_at  TIMESTAMP DEFAULT NOW()
);

-- AI analysis reports
CREATE TABLE reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID REFERENCES documents(id) ON DELETE SET NULL,
    module        VARCHAR(100) NOT NULL,
    status        VARCHAR(50) DEFAULT 'PENDING',
    result_json   JSONB,
    llm_used      VARCHAR(100),
    tokens_used   INTEGER,
    error_message TEXT,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- LLM fallback audit trail
CREATE TABLE llm_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES reports(id) ON DELETE CASCADE,
    provider_tried  VARCHAR(100),
    success         BOOLEAN,
    fallback_reason TEXT,
    latency_ms      INTEGER,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- OTP store for email verification
CREATE TABLE otp_store (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(10) NOT NULL,
    purpose     VARCHAR(50) NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_reports_document ON reports(document_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_otp_email_purpose ON otp_store(email, purpose);
CREATE INDEX idx_users_email ON users(email);
