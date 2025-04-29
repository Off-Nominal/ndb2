  INSERT INTO snooze_votes (
    snooze_check_id,
    user_id,
    value,
    created_at
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )   
  ON CONFLICT (snooze_check_id, user_id)
    DO UPDATE SET value = $3, created_at = $4 
  RETURNING snooze_check_id, user_id, value, created_at