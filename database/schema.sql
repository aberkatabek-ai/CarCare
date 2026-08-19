ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(60);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_token_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS stored_file_name TEXT;

ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS original_file_name TEXT;

ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS file_mime_type VARCHAR(120);

ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS file_size INTEGER;

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_active
ON password_reset_codes(user_id, email, expires_at)
WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID NOT NULL UNIQUE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_active
ON auth_refresh_tokens(user_id, expires_at DESC)
WHERE revoked_at IS NULL;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS vehicle_status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS normalized_license_plate VARCHAR(32);

UPDATE vehicles
SET vehicle_status = 'active'
WHERE vehicle_status IS NULL;

UPDATE vehicles
SET normalized_license_plate = UPPER(
    REGEXP_REPLACE(
        COALESCE(license_plate, ''),
        '[^A-Za-z0-9]',
        '',
        'g'
    )
)
WHERE license_plate IS NOT NULL
  AND (
    normalized_license_plate IS NULL
    OR normalized_license_plate = ''
  );

ALTER TABLE vehicles
DROP CONSTRAINT IF EXISTS chk_vehicle_status;

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicle_status
CHECK (vehicle_status IN ('active', 'sold'));

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_status VARCHAR(20) NOT NULL DEFAULT 'not_started';

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_verified_at TIMESTAMPTZ;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_verification_score INTEGER;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_document_id BIGINT REFERENCES vehicle_documents(id) ON DELETE SET NULL;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_failure_reason TEXT;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_stored_file_name TEXT;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_original_file_name TEXT;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS ownership_file_mime_type VARCHAR(120);

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

UPDATE vehicles
SET ownership_status = CASE
    WHEN normalized_license_plate IS NULL THEN 'not_started'
    ELSE 'unverified'
END
WHERE ownership_status IS NULL
   OR ownership_status = '';

ALTER TABLE vehicles
DROP CONSTRAINT IF EXISTS chk_ownership_status;

ALTER TABLE vehicles
ADD CONSTRAINT chk_ownership_status
CHECK (
    ownership_status IN (
        'not_started',
        'unverified',
        'verified',
        'failed'
    )
);

DROP INDEX IF EXISTS idx_vehicles_active_plate_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_verified_plate_unique
ON vehicles(normalized_license_plate)
WHERE vehicle_status = 'active'
  AND ownership_status = 'verified'
  AND normalized_license_plate IS NOT NULL;

CREATE TABLE IF NOT EXISTS reminder_deliveries (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_kind VARCHAR(40) NOT NULL,
    reminder_reference TEXT NOT NULL,
    reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_deliveries_daily_unique
ON reminder_deliveries(user_id, reminder_kind, reminder_date, reminder_reference);

CREATE TABLE IF NOT EXISTS vehicle_issue_media (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES vehicle_issues(id) ON DELETE CASCADE,
    stored_file_name TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    file_mime_type VARCHAR(120) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_issue_media_issue_id
ON vehicle_issue_media(issue_id);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    reply TEXT NOT NULL,
    garage_context JSONB NOT NULL,
    model_name VARCHAR(120),
    feedback_status VARCHAR(20) NOT NULL DEFAULT 'unrated',
    feedback_note TEXT,
    helpfulness_score SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    feedback_updated_at TIMESTAMPTZ
);

ALTER TABLE ai_conversations
DROP CONSTRAINT IF EXISTS chk_ai_conversations_feedback_status;

ALTER TABLE ai_conversations
ADD CONSTRAINT chk_ai_conversations_feedback_status
CHECK (
    feedback_status IN (
        'unrated',
        'helpful',
        'not_helpful'
    )
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created_at
ON ai_conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_feedback_status
ON ai_conversations(feedback_status, created_at DESC);
