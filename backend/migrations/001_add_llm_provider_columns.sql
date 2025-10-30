-- Add LLM provider columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS llm_provider VARCHAR DEFAULT 'anthropic',
ADD COLUMN IF NOT EXISTS llm_model VARCHAR,
ADD COLUMN IF NOT EXISTS anthropic_api_key VARCHAR,
ADD COLUMN IF NOT EXISTS openai_api_key VARCHAR,
ADD COLUMN IF NOT EXISTS google_api_key VARCHAR,
ADD COLUMN IF NOT EXISTS openrouter_api_key VARCHAR;
