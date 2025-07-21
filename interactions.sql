-- SQL for Vercel Postgres: create the interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  messages JSONB NOT NULL,
  task_type TEXT,
  telemetry JSONB,
  user_agent TEXT,
  ip TEXT,
  timestamp BIGINT,
  qualtrics_id TEXT
);
