INSERT INTO predictions (
  user_id,
  text,
  created_date,
  driver,
  due_date
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5
) RETURNING id