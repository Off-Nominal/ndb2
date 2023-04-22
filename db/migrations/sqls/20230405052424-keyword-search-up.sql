/* Replace with your SQL commands */

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX predictions_text_idx ON predictions USING gist (text gist_trgm_ops)