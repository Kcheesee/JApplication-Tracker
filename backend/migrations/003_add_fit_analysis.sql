-- Migration to add fit analysis and tailoring plan columns to applications table
ALTER TABLE applications ADD COLUMN fit_analysis_score FLOAT NULL;
ALTER TABLE applications ADD COLUMN fit_analysis_label VARCHAR(255) NULL;
ALTER TABLE applications ADD COLUMN fit_analysis_should_apply VARCHAR(10) NULL;
ALTER TABLE applications ADD COLUMN fit_analysis_recommendation TEXT NULL;
ALTER TABLE applications ADD COLUMN fit_analysis_data TEXT NULL; -- JSON stored as text
ALTER TABLE applications ADD COLUMN fit_analysis_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE applications ADD COLUMN tailoring_plan TEXT NULL; -- JSON stored as text
ALTER TABLE applications ADD COLUMN tailoring_plan_date TIMESTAMP WITH TIME ZONE NULL;
