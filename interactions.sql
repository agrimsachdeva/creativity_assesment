-- SQL for Vercel Postgres: create the interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  subject_id TEXT NOT NULL, -- Unique identifier for the subject
  task_type TEXT NOT NULL, -- Either 'divergent' or 'convergent'
  transcript JSONB NOT NULL, -- Full chat transcript (user and AI messages)
  task_responses JSONB NOT NULL, -- Responses to the task (AUT ideas or RAT answers)
  engagement_metrics JSONB NOT NULL, -- Detailed analytics (e.g., copy/paste info, chatbot usage)
  start_time TIMESTAMP NOT NULL, -- Experiment start time
  end_time TIMESTAMP NOT NULL, -- Experiment end time
  qualtrics_id TEXT -- Optional Qualtrics ID for tracking
);
