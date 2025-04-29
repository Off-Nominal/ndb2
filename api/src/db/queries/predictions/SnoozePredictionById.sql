UPDATE predictions 
SET 
 check_date = predictions.check_date + '1 day'::INTERVAL * $2
WHERE predictions.id = $1;
