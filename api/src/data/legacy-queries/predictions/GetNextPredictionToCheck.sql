  SELECT 
    id, 
    check_date 
  FROM predictions 
  WHERE driver = 'event' 
    AND check_date < NOW() 
    AND status = 'open' 
  ORDER BY check_date ASC LIMIT 1