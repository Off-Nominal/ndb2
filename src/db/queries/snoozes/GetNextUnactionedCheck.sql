SELECT 
  id
FROM snooze_checks
WHERE closed IS false
AND check_date <= NOW() + INTERVAL '1 day'
ORDER BY check_date
LIMIT 1;