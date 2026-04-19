/* @name insertOauthLoginState */
INSERT INTO oauth_login_states (state, return_to, expires_at, code_verifier)
VALUES (:state!, :return_to!, :expires_at!, :code_verifier!)
RETURNING state;

/* @name deleteOauthLoginStateReturning */
DELETE FROM oauth_login_states
WHERE state = :state!
  AND expires_at > now()
RETURNING return_to, code_verifier;
