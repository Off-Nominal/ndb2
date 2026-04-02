-- migrate:up

ALTER TABLE users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- migrate:down

ALTER TABLE users
  ALTER COLUMN id DROP DEFAULT;

