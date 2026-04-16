UPDATE snooze_checks
  SET closed = true,
      closed_at = NOW()
  WHERE prediction_id = $1;