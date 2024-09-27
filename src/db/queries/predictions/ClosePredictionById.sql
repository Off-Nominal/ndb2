UPDATE predictions 
SET 
  triggerer_id = $2, 
  closed_date = $3, 
  triggered_date = NOW() 
WHERE predictions.id = $1;
