/* Replace with your SQL commands */

BEGIN;

ALTER TABLE predictions
  ALTER COLUMN due_date DROP NOT NULL;

ALTER TABLE predictions
  ADD COLUMN driver TEXT NOT NULL DEFAULT 'date' CHECK (driver in ('event', 'date')),
  ADD COLUMN check_date TIMESTAMPTZ,
  ADD COLUMN last_check_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS checks (
  id SERIAL PRIMARY KEY,
  prediction_id INT REFERENCES predictions(id) ON DELETE CASCADE,
  check_date TIMESTAMPTZ NOT NULL,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_checks (
  check_id INT REFERENCES checks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  value SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT user_checks_pkey PRIMARY KEY (check_id, user_id)
);

COMMIT;