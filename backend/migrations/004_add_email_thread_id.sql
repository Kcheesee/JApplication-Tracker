-- Track Gmail thread IDs so repeated messages from the same email thread update
-- the existing application instead of creating duplicate job entries.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS email_thread_id VARCHAR NULL;
CREATE INDEX IF NOT EXISTS ix_applications_email_thread_id ON applications(email_thread_id);
