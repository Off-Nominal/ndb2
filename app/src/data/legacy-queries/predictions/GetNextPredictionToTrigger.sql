SELECT 
  id, 
  due_date 
FROM predictions 
WHERE driver = 'date' 
  AND due_date < NOW() 
  AND status = 'open'
ORDER BY due_date ASC LIMIT 1