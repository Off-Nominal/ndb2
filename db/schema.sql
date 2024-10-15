CREATE TABLE IF NOT EXISTS snooze_checks (
  id SERIAL PRIMARY KEY,
  prediction_id INT REFERENCES predictions(id) ON DELETE CASCADE,
  check_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS snooze_votes (
  snooze_check_id INT REFERENCES snooze_checks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  value SMALLINT NOT NULL CHECK (value in (1, 7, 30, 90, 365)),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT snooze_votes_pkey PRIMARY KEY (snooze_check_id, user_id)
);