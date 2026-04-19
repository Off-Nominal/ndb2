/* @name insertOauthLoginState */
INSERT INTO oauth_login_states (state, return_to, expires_at)
VALUES (:state!, :return_to!, :expires_at!)
RETURNING state;

/* @name deleteOauthLoginStateReturning */
DELETE FROM oauth_login_states
WHERE state = :state!
  AND expires_at > now()
RETURNING return_to;
