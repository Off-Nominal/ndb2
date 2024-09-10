/* Replace with your SQL commands */

BEGIN;

ALTER TABLE predictions
  ALTER COLUMN due_date SET NOT NULL;

ALTER TABLE predictions
  DROP COLUMN driver,
  DROP COLUMN check_date,
  DROP COLUMN last_check_date;

DROP TABLE checks;

DROP TABLE user_checks;

COMMIT;