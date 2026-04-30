/* @name userParticipatesInSeason */
SELECT EXISTS (
  SELECT 1 FROM (
    SELECT 1 FROM predictions p
    WHERE p.season_id = :season_id! AND p.user_id = :user_id!
    UNION
    SELECT 1 FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE p.season_id = :season_id! AND b.user_id = :user_id!
    UNION
    SELECT 1 FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE p.season_id = :season_id! AND v.user_id = :user_id!
  ) t
) AS participates;

/* @name getSeasonResultsLeaderboard */
WITH participants AS (
  SELECT DISTINCT uid AS user_id FROM (
    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
    UNION
    SELECT b.user_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE p.season_id = :season_id!
    UNION
    SELECT v.user_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE p.season_id = :season_id!
  ) x
),
pred_stats AS (
  SELECT
    p.user_id,
    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
  FROM predictions p
  WHERE p.season_id = :season_id!
  GROUP BY p.user_id
),
bet_stats AS (
  SELECT
    b.user_id,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
      ) AND b.valid IS TRUE
    )::int AS bets_successful,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
      ) AND b.valid IS TRUE
    )::int AS bets_failed,
    COUNT(*) FILTER (
      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
    )::int AS bets_pending,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY b.user_id
),
vote_stats AS (
  SELECT
    v.user_id,
    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
  FROM votes v
  INNER JOIN predictions p ON p.id = v.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY v.user_id
),
point_stats AS (
  SELECT
    b.user_id,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
    COALESCE(SUM(b.season_payout), 0)::int AS points_net
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY b.user_id
),
joined AS (
  SELECT
    pt.user_id,
    u.discord_id,
    COALESCE(pr.predictions_successful, 0) AS predictions_successful,
    COALESCE(pr.predictions_failed, 0) AS predictions_failed,
    COALESCE(pr.predictions_open, 0) AS predictions_open,
    COALESCE(pr.predictions_closed, 0) AS predictions_closed,
    COALESCE(pr.predictions_checking, 0) AS predictions_checking,
    COALESCE(pr.predictions_retired, 0) AS predictions_retired,
    COALESCE(be.bets_successful, 0) AS bets_successful,
    COALESCE(be.bets_failed, 0) AS bets_failed,
    COALESCE(be.bets_pending, 0) AS bets_pending,
    COALESCE(be.bets_retired, 0) AS bets_retired,
    COALESCE(be.bets_invalid, 0) AS bets_invalid,
    COALESCE(vo.votes_yes, 0) AS votes_yes,
    COALESCE(vo.votes_no, 0) AS votes_no,
    COALESCE(vo.votes_pending, 0) AS votes_pending,
    COALESCE(po.points_rewards, 0) AS points_rewards,
    COALESCE(po.points_penalties, 0) AS points_penalties,
    COALESCE(po.points_net, 0) AS points_net
  FROM participants pt
  INNER JOIN users u ON u.id = pt.user_id
  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
  LEFT JOIN bet_stats be ON be.user_id = pt.user_id
  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
  LEFT JOIN point_stats po ON po.user_id = pt.user_id
),
ranked AS (
  SELECT
    j.user_id,
    j.discord_id,
    j.predictions_successful,
    j.predictions_failed,
    j.predictions_open,
    j.predictions_closed,
    j.predictions_checking,
    j.predictions_retired,
    j.bets_successful,
    j.bets_failed,
    j.bets_pending,
    j.bets_retired,
    j.bets_invalid,
    j.votes_yes,
    j.votes_no,
    j.votes_pending,
    j.points_rewards,
    j.points_penalties,
    j.points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.points_net DESC, j.user_id ASC
    )) AS integer) AS rank_points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.predictions_successful DESC, j.user_id ASC
    )) AS integer) AS rank_predictions_successful,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.bets_successful DESC, j.user_id ASC
    )) AS integer) AS rank_bets_successful
  FROM joined j
)
SELECT
  r.user_id,
  r.discord_id,
  r.predictions_successful,
  r.predictions_failed,
  r.predictions_open,
  r.predictions_closed,
  r.predictions_checking,
  r.predictions_retired,
  r.bets_successful,
  r.bets_failed,
  r.bets_pending,
  r.bets_retired,
  r.bets_invalid,
  r.votes_yes,
  r.votes_no,
  r.votes_pending,
  r.points_rewards,
  r.points_penalties,
  r.points_net,
  r.rank_points_net,
  r.rank_predictions_successful,
  r.rank_bets_successful
FROM ranked r
ORDER BY
  (CASE WHEN :sort_by::text = 'points_net-desc' THEN r.points_net END) DESC NULLS LAST,
  (CASE WHEN :sort_by::text = 'points_net-asc' THEN r.points_net END) ASC NULLS LAST,
  (CASE WHEN :sort_by::text = 'predictions_successful-desc' THEN r.predictions_successful END) DESC NULLS LAST,
  (CASE WHEN :sort_by::text = 'predictions_successful-asc' THEN r.predictions_successful END) ASC NULLS LAST,
  (CASE WHEN :sort_by::text = 'bets_successful-desc' THEN r.bets_successful END) DESC NULLS LAST,
  (CASE WHEN :sort_by::text = 'bets_successful-asc' THEN r.bets_successful END) ASC NULLS LAST,
  r.points_net DESC,
  r.predictions_successful DESC,
  r.bets_successful DESC,
  r.user_id ASC
LIMIT :limit!
OFFSET :row_offset!;

/* @name countSeasonLeaderboardParticipants */
SELECT CAST(COUNT(*) AS integer) AS total_count
FROM (
  SELECT DISTINCT uid FROM (
    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
    UNION
    SELECT b.user_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE p.season_id = :season_id!
    UNION
    SELECT v.user_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE p.season_id = :season_id!
  ) x
) y;

/* @name getSeasonResultForUser */
WITH participants AS (
  SELECT DISTINCT uid AS user_id FROM (
    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
    UNION
    SELECT b.user_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE p.season_id = :season_id!
    UNION
    SELECT v.user_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE p.season_id = :season_id!
  ) x
),
pred_stats AS (
  SELECT
    p.user_id,
    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
  FROM predictions p
  WHERE p.season_id = :season_id!
  GROUP BY p.user_id
),
bet_stats AS (
  SELECT
    b.user_id,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
      ) AND b.valid IS TRUE
    )::int AS bets_successful,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
      ) AND b.valid IS TRUE
    )::int AS bets_failed,
    COUNT(*) FILTER (
      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
    )::int AS bets_pending,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY b.user_id
),
vote_stats AS (
  SELECT
    v.user_id,
    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
  FROM votes v
  INNER JOIN predictions p ON p.id = v.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY v.user_id
),
point_stats AS (
  SELECT
    b.user_id,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
    COALESCE(SUM(b.season_payout), 0)::int AS points_net
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id = :season_id!
  GROUP BY b.user_id
),
joined AS (
  SELECT
    pt.user_id,
    u.discord_id,
    COALESCE(pr.predictions_successful, 0) AS predictions_successful,
    COALESCE(pr.predictions_failed, 0) AS predictions_failed,
    COALESCE(pr.predictions_open, 0) AS predictions_open,
    COALESCE(pr.predictions_closed, 0) AS predictions_closed,
    COALESCE(pr.predictions_checking, 0) AS predictions_checking,
    COALESCE(pr.predictions_retired, 0) AS predictions_retired,
    COALESCE(be.bets_successful, 0) AS bets_successful,
    COALESCE(be.bets_failed, 0) AS bets_failed,
    COALESCE(be.bets_pending, 0) AS bets_pending,
    COALESCE(be.bets_retired, 0) AS bets_retired,
    COALESCE(be.bets_invalid, 0) AS bets_invalid,
    COALESCE(vo.votes_yes, 0) AS votes_yes,
    COALESCE(vo.votes_no, 0) AS votes_no,
    COALESCE(vo.votes_pending, 0) AS votes_pending,
    COALESCE(po.points_rewards, 0) AS points_rewards,
    COALESCE(po.points_penalties, 0) AS points_penalties,
    COALESCE(po.points_net, 0) AS points_net
  FROM participants pt
  INNER JOIN users u ON u.id = pt.user_id
  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
  LEFT JOIN bet_stats be ON be.user_id = pt.user_id
  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
  LEFT JOIN point_stats po ON po.user_id = pt.user_id
),
ranked AS (
  SELECT
    j.user_id,
    j.discord_id,
    j.predictions_successful,
    j.predictions_failed,
    j.predictions_open,
    j.predictions_closed,
    j.predictions_checking,
    j.predictions_retired,
    j.bets_successful,
    j.bets_failed,
    j.bets_pending,
    j.bets_retired,
    j.bets_invalid,
    j.votes_yes,
    j.votes_no,
    j.votes_pending,
    j.points_rewards,
    j.points_penalties,
    j.points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.points_net DESC, j.user_id ASC
    )) AS integer) AS rank_points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.predictions_successful DESC, j.user_id ASC
    )) AS integer) AS rank_predictions_successful,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.bets_successful DESC, j.user_id ASC
    )) AS integer) AS rank_bets_successful,
    CAST((COUNT(*) OVER ()) AS integer) AS total_participants
  FROM joined j
)
SELECT
  r.user_id,
  r.discord_id,
  r.predictions_successful,
  r.predictions_failed,
  r.predictions_open,
  r.predictions_closed,
  r.predictions_checking,
  r.predictions_retired,
  r.bets_successful,
  r.bets_failed,
  r.bets_pending,
  r.bets_retired,
  r.bets_invalid,
  r.votes_yes,
  r.votes_no,
  r.votes_pending,
  r.points_rewards,
  r.points_penalties,
  r.points_net,
  r.rank_points_net,
  r.rank_predictions_successful,
  r.rank_bets_successful,
  r.total_participants
FROM ranked r
WHERE r.user_id = :user_id!;

/* @name countUserSeasonsForResults */
SELECT CAST(COUNT(*) AS integer) AS total_count
FROM (
  SELECT DISTINCT season_id FROM (
    SELECT p.season_id FROM predictions p
    WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL
    UNION
    SELECT p.season_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL
    UNION
    SELECT p.season_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL
  ) x
) s;

/* @name getUserSeasonResultsPage */
WITH user_seasons AS (
  SELECT DISTINCT season_id FROM (
    SELECT p.season_id FROM predictions p
    WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL
    UNION
    SELECT p.season_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL
    UNION
    SELECT p.season_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL
  ) x
),
season_page AS (
  SELECT s.id AS season_id, s.name, s.start, s."end"
  FROM user_seasons us
  INNER JOIN seasons s ON s.id = us.season_id
  ORDER BY
    (CASE WHEN :sort_by::text = 'season_end-desc' THEN s."end" END) DESC NULLS LAST,
    (CASE WHEN :sort_by::text = 'season_end-asc' THEN s."end" END) ASC NULLS LAST,
    s.id ASC
  LIMIT :limit!
  OFFSET :row_offset!
),
page_season_ids AS (
  SELECT season_id FROM season_page
),
participants_scoped AS (
  SELECT DISTINCT season_id, uid AS user_id FROM (
    SELECT p.season_id, p.user_id AS uid FROM predictions p
    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
    UNION
    SELECT p.season_id, b.user_id FROM bets b
    INNER JOIN predictions p ON p.id = b.prediction_id
    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
    UNION
    SELECT p.season_id, v.user_id FROM votes v
    INNER JOIN predictions p ON p.id = v.prediction_id
    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
  ) x
),
pred_stats_all AS (
  SELECT
    p.season_id,
    p.user_id,
    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
  FROM predictions p
  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
  GROUP BY p.season_id, p.user_id
),
bet_stats_all AS (
  SELECT
    p.season_id,
    b.user_id,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
      ) AND b.valid IS TRUE
    )::int AS bets_successful,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
      ) AND b.valid IS TRUE
    )::int AS bets_failed,
    COUNT(*) FILTER (
      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
    )::int AS bets_pending,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
  GROUP BY p.season_id, b.user_id
),
vote_stats_all AS (
  SELECT
    p.season_id,
    v.user_id,
    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
  FROM votes v
  INNER JOIN predictions p ON p.id = v.prediction_id
  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
  GROUP BY p.season_id, v.user_id
),
point_stats_all AS (
  SELECT
    p.season_id,
    b.user_id,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
    COALESCE(SUM(b.season_payout), 0)::int AS points_net
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
  GROUP BY p.season_id, b.user_id
),
joined_all AS (
  SELECT
    ps.season_id,
    ps.user_id,
    u.discord_id,
    COALESCE(pr.predictions_successful, 0) AS predictions_successful,
    COALESCE(pr.predictions_failed, 0) AS predictions_failed,
    COALESCE(pr.predictions_open, 0) AS predictions_open,
    COALESCE(pr.predictions_closed, 0) AS predictions_closed,
    COALESCE(pr.predictions_checking, 0) AS predictions_checking,
    COALESCE(pr.predictions_retired, 0) AS predictions_retired,
    COALESCE(be.bets_successful, 0) AS bets_successful,
    COALESCE(be.bets_failed, 0) AS bets_failed,
    COALESCE(be.bets_pending, 0) AS bets_pending,
    COALESCE(be.bets_retired, 0) AS bets_retired,
    COALESCE(be.bets_invalid, 0) AS bets_invalid,
    COALESCE(vo.votes_yes, 0) AS votes_yes,
    COALESCE(vo.votes_no, 0) AS votes_no,
    COALESCE(vo.votes_pending, 0) AS votes_pending,
    COALESCE(po.points_rewards, 0) AS points_rewards,
    COALESCE(po.points_penalties, 0) AS points_penalties,
    COALESCE(po.points_net, 0) AS points_net
  FROM participants_scoped ps
  INNER JOIN users u ON u.id = ps.user_id
  LEFT JOIN pred_stats_all pr ON pr.season_id = ps.season_id AND pr.user_id = ps.user_id
  LEFT JOIN bet_stats_all be ON be.season_id = ps.season_id AND be.user_id = ps.user_id
  LEFT JOIN vote_stats_all vo ON vo.season_id = ps.season_id AND vo.user_id = ps.user_id
  LEFT JOIN point_stats_all po ON po.season_id = ps.season_id AND po.user_id = ps.user_id
),
ranked_all AS (
  SELECT
    ja.season_id,
    ja.user_id,
    ja.discord_id,
    ja.predictions_successful,
    ja.predictions_failed,
    ja.predictions_open,
    ja.predictions_closed,
    ja.predictions_checking,
    ja.predictions_retired,
    ja.bets_successful,
    ja.bets_failed,
    ja.bets_pending,
    ja.bets_retired,
    ja.bets_invalid,
    ja.votes_yes,
    ja.votes_no,
    ja.votes_pending,
    ja.points_rewards,
    ja.points_penalties,
    ja.points_net,
    CAST((ROW_NUMBER() OVER (
      PARTITION BY ja.season_id ORDER BY ja.points_net DESC, ja.user_id ASC
    )) AS integer) AS rank_points_net,
    CAST((ROW_NUMBER() OVER (
      PARTITION BY ja.season_id ORDER BY ja.predictions_successful DESC, ja.user_id ASC
    )) AS integer) AS rank_predictions_successful,
    CAST((ROW_NUMBER() OVER (
      PARTITION BY ja.season_id ORDER BY ja.bets_successful DESC, ja.user_id ASC
    )) AS integer) AS rank_bets_successful,
    CAST((COUNT(*) OVER (PARTITION BY ja.season_id)) AS integer) AS total_participants
  FROM joined_all ja
)
SELECT
  sp.season_id,
  sp.name AS season_name,
  sp.start AS season_start,
  sp."end" AS season_end,
  ra.total_participants,
  ra.predictions_successful,
  ra.predictions_failed,
  ra.predictions_open,
  ra.predictions_closed,
  ra.predictions_checking,
  ra.predictions_retired,
  ra.bets_successful,
  ra.bets_failed,
  ra.bets_pending,
  ra.bets_retired,
  ra.bets_invalid,
  ra.votes_yes,
  ra.votes_no,
  ra.votes_pending,
  ra.points_rewards,
  ra.points_penalties,
  ra.points_net,
  ra.rank_points_net,
  ra.rank_predictions_successful,
  ra.rank_bets_successful
FROM season_page sp
INNER JOIN ranked_all ra ON ra.season_id = sp.season_id AND ra.user_id = :user_id!
ORDER BY
  (CASE WHEN :sort_by::text = 'season_end-desc' THEN sp."end" END) DESC NULLS LAST,
  (CASE WHEN :sort_by::text = 'season_end-asc' THEN sp."end" END) ASC NULLS LAST,
  sp.season_id ASC;

/* @name getAllTimeResultForUser */
WITH participants AS (
  SELECT DISTINCT uid AS user_id FROM (
    SELECT user_id AS uid FROM predictions
    UNION
    SELECT user_id FROM bets
    UNION
    SELECT user_id FROM votes
  ) x
),
pred_stats AS (
  SELECT
    p.user_id,
    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
  FROM predictions p
  GROUP BY p.user_id
),
bet_stats AS (
  SELECT
    b.user_id,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
      ) AND b.valid IS TRUE
    )::int AS bets_successful,
    COUNT(*) FILTER (
      WHERE (
        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
      ) AND b.valid IS TRUE
    )::int AS bets_failed,
    COUNT(*) FILTER (
      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
    )::int AS bets_pending,
    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
  FROM bets b
  INNER JOIN predictions p ON p.id = b.prediction_id
  GROUP BY b.user_id
),
vote_stats AS (
  SELECT
    v.user_id,
    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
  FROM votes v
  INNER JOIN predictions p ON p.id = v.prediction_id
  GROUP BY v.user_id
),
point_stats AS (
  SELECT
    b.user_id,
    COALESCE(SUM(b.payout) FILTER (WHERE b.payout > 0), 0)::int AS points_rewards,
    COALESCE(SUM(b.payout) FILTER (WHERE b.payout < 0), 0)::int AS points_penalties,
    COALESCE(SUM(b.payout), 0)::int AS points_net
  FROM bets b
  GROUP BY b.user_id
),
joined AS (
  SELECT
    pt.user_id,
    u.discord_id,
    COALESCE(pr.predictions_successful, 0) AS predictions_successful,
    COALESCE(pr.predictions_failed, 0) AS predictions_failed,
    COALESCE(pr.predictions_open, 0) AS predictions_open,
    COALESCE(pr.predictions_closed, 0) AS predictions_closed,
    COALESCE(pr.predictions_checking, 0) AS predictions_checking,
    COALESCE(pr.predictions_retired, 0) AS predictions_retired,
    COALESCE(be.bets_successful, 0) AS bets_successful,
    COALESCE(be.bets_failed, 0) AS bets_failed,
    COALESCE(be.bets_pending, 0) AS bets_pending,
    COALESCE(be.bets_retired, 0) AS bets_retired,
    COALESCE(be.bets_invalid, 0) AS bets_invalid,
    COALESCE(vo.votes_yes, 0) AS votes_yes,
    COALESCE(vo.votes_no, 0) AS votes_no,
    COALESCE(vo.votes_pending, 0) AS votes_pending,
    COALESCE(po.points_rewards, 0) AS points_rewards,
    COALESCE(po.points_penalties, 0) AS points_penalties,
    COALESCE(po.points_net, 0) AS points_net
  FROM participants pt
  INNER JOIN users u ON u.id = pt.user_id
  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
  LEFT JOIN bet_stats be ON be.user_id = pt.user_id
  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
  LEFT JOIN point_stats po ON po.user_id = pt.user_id
),
ranked AS (
  SELECT
    j.user_id,
    j.discord_id,
    j.predictions_successful,
    j.predictions_failed,
    j.predictions_open,
    j.predictions_closed,
    j.predictions_checking,
    j.predictions_retired,
    j.bets_successful,
    j.bets_failed,
    j.bets_pending,
    j.bets_retired,
    j.bets_invalid,
    j.votes_yes,
    j.votes_no,
    j.votes_pending,
    j.points_rewards,
    j.points_penalties,
    j.points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.points_net DESC, j.user_id ASC
    )) AS integer) AS rank_points_net,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.predictions_successful DESC, j.user_id ASC
    )) AS integer) AS rank_predictions_successful,
    CAST((ROW_NUMBER() OVER (
      ORDER BY j.bets_successful DESC, j.user_id ASC
    )) AS integer) AS rank_bets_successful
  FROM joined j
)
SELECT
  u.id AS user_id,
  u.discord_id,
  COALESCE(rk.predictions_successful, 0) AS predictions_successful,
  COALESCE(rk.predictions_failed, 0) AS predictions_failed,
  COALESCE(rk.predictions_open, 0) AS predictions_open,
  COALESCE(rk.predictions_closed, 0) AS predictions_closed,
  COALESCE(rk.predictions_checking, 0) AS predictions_checking,
  COALESCE(rk.predictions_retired, 0) AS predictions_retired,
  COALESCE(rk.bets_successful, 0) AS bets_successful,
  COALESCE(rk.bets_failed, 0) AS bets_failed,
  COALESCE(rk.bets_pending, 0) AS bets_pending,
  COALESCE(rk.bets_retired, 0) AS bets_retired,
  COALESCE(rk.bets_invalid, 0) AS bets_invalid,
  COALESCE(rk.votes_yes, 0) AS votes_yes,
  COALESCE(rk.votes_no, 0) AS votes_no,
  COALESCE(rk.votes_pending, 0) AS votes_pending,
  COALESCE(rk.points_rewards, 0) AS points_rewards,
  COALESCE(rk.points_penalties, 0) AS points_penalties,
  COALESCE(rk.points_net, 0) AS points_net,
  rk.rank_points_net,
  rk.rank_predictions_successful,
  rk.rank_bets_successful,
  (SELECT CAST(COUNT(*) AS integer) FROM participants) AS total_participants
FROM users u
LEFT JOIN ranked rk ON rk.user_id = u.id
WHERE u.id = :user_id!;
