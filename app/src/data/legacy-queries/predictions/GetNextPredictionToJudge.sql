SELECT 
  id 
FROM predictions 
WHERE status = 'closed'
  AND triggered_date + '1 day' < NOW() 
ORDER BY due_date ASC LIMIT 1