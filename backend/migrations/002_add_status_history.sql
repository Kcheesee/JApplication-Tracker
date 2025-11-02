-- Create status_history table for tracking application status changes
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status VARCHAR,
    new_status VARCHAR NOT NULL,
    notes TEXT,
    changed_by VARCHAR,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application
        FOREIGN KEY(application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);

-- Populate initial status history for existing applications
-- This gives existing apps a baseline status history entry
INSERT INTO status_history (application_id, old_status, new_status, changed_at)
SELECT id, NULL, status, created_at
FROM applications
WHERE NOT EXISTS (
    SELECT 1 FROM status_history WHERE application_id = applications.id
);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Status history table created and populated successfully';
END $$;
