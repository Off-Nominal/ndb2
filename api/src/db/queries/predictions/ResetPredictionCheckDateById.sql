UPDATE predictions 
SET 
 check_date = NOW()
WHERE predictions.id = $1;
