/* @name insertWebSession */
INSERT INTO web_sessions (user_id, csrf_token, expires_at, last_discord_authz_at)
VALUES (:user_id!, :csrf_token!, :expires_at!, :last_discord_authz_at!)
RETURNING id, user_id, csrf_token, expires_at, last_discord_authz_at;

/* @name getWebSessionWithUser */
SELECT
  s.id,
  s.user_id,
  s.csrf_token,
  s.last_discord_authz_at,
  u.discord_id
FROM web_sessions s
JOIN users u ON u.id = s.user_id
WHERE s.id = :id!
  AND s.revoked_at IS NULL
  AND s.expires_at > now();

/* @name updateWebSessionLastDiscordAuthzAt */
UPDATE web_sessions
SET last_discord_authz_at = :last_discord_authz_at!
WHERE id = :id!
  AND revoked_at IS NULL
  AND expires_at > now()
RETURNING id, last_discord_authz_at;

/* @name revokeWebSession */
UPDATE web_sessions
SET revoked_at = now()
WHERE id = :id!
  AND revoked_at IS NULL
RETURNING id;
