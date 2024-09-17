UPDATE predictions SET 
  triggerer_id = NULL,
  triggered_date = NULL
WHERE id = $1