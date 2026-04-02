/* @name getAllSeasons */
SELECT
  id,
  name,
  start,
  "end",
  wager_cap,
  closed
FROM seasons
ORDER BY "end" DESC;

/* @name getSeasonById */
SELECT
  id,
  name,
  start,
  "end",
  wager_cap,
  closed
FROM seasons
WHERE id = :id!;