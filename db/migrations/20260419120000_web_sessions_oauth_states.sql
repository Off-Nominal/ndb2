-- migrate:up

CREATE TABLE oauth_login_states (
    state text PRIMARY KEY,
    return_to text NOT NULL,
    expires_at timestamptz NOT NULL
);

CREATE INDEX oauth_login_states_expires_at_idx ON oauth_login_states (expires_at);

CREATE TABLE web_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    csrf_token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    last_seen_at timestamptz
);

CREATE INDEX web_sessions_user_id_idx ON web_sessions (user_id);
CREATE INDEX web_sessions_expires_at_idx ON web_sessions (expires_at);

-- migrate:down

DROP TABLE IF EXISTS web_sessions;
DROP TABLE IF EXISTS oauth_login_states;
