/* Replace with your SQL commands */

BEGIN;

ALTER TABLE seasons 
  ADD COLUMN closed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE seasons SET closed = TRUE WHERE "end" < NOW();

COMMIT;