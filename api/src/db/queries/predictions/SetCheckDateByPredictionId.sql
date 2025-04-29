UPDATE predictions 
SET check_date = $2
WHERE predictions.id = $1;
