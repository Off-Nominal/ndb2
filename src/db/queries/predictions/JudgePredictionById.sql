UPDATE predictions SET judged_date = NOW() WHERE predictions.id = $1;