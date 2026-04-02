-- migrate:up

ALTER TABLE predictions
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

CREATE INDEX predictions_search_vector_idx ON predictions USING gin (search_vector);

CREATE INDEX IF NOT EXISTS predictions_text_gist_trgm_idx
  ON predictions USING gist (text gist_trgm_ops);

ANALYZE predictions;

-- migrate:down

DROP INDEX IF EXISTS predictions_text_gist_trgm_idx;
DROP INDEX IF EXISTS predictions_search_vector_idx;

ALTER TABLE predictions DROP COLUMN IF EXISTS search_vector;
