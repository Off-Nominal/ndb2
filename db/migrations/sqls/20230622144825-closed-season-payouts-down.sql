BEGIN;

UPDATE bets b SET season_payout =
  (CASE
    WHEN b.valid IS FALSE THEN NULL
    WHEN p.status = 'open' THEN NULL
    WHEN p.status = 'retired' THEN NULL
    WHEN p.status = 'closed' THEN NULL
    ELSE COALESCE(
        NULLIF(
          FLOOR(
            LEAST(b.wager, s.wager_cap) *
            (CASE
              WHEN b.endorsed IS TRUE
                THEN p.endorse_ratio
                ELSE p.undorse_ratio
            END)
          ), 0
        ), 1
      ) *
      (CASE
        WHEN 
          (p.status = 'successful' AND b.endorsed IS TRUE) OR 
          (p.status = 'failed' AND b.endorsed IS FALSE)
        THEN 1
        ELSE -1
      END)
    END)
FROM predictions p
JOIN seasons s ON p.season_id = s.id
WHERE p.triggerer_id IS NOT NULL 
  AND (SELECT s.closed FROM seasons s WHERE p.season_id = s.id) IS TRUE
  AND (SELECT p.season_id != s.id FROM seasons s WHERE p.due_date >= s.start AND p.due_date < s.end) IS TRUE
  AND b.prediction_id = p.id;

CREATE OR REPLACE FUNCTION refresh_payouts_from_season() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET 
        payout = 
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.season_id = NEW.id;
    RETURN NEW;
  END;
$$;

CREATE OR REPLACE FUNCTION refresh_payouts_from_prediction() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET 
        payout = 
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN b.endorsed IS TRUE
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.id = b.prediction_id AND p.id = NEW.id;
    RETURN NEW;
  END;
$$;

DROP TRIGGER prediction_season_applicable_update_from_predictions ON predictions;

DROP FUNCTION refresh_prediction_season_applicable();

ALTER TABLE predictions
  DROP COLUMN season_applicable;

COMMIT;