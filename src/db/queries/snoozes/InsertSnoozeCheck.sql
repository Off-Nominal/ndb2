  INSERT INTO snooze_checks (
    prediction_id
  ) VALUES (
    $1
  ) RETURNING id, prediction_id, check_date, closed, closed_at