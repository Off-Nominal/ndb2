  UPDATE snooze_checks
  SET closed = true, closed_at = NOW()
  WHERE id = $1
  RETURNING id, prediction_id, check_date, closed, closed_at