-- Test Database Seeding Script
-- This script adds basic test data to the database

-- Insert two test users
INSERT INTO users (id, discord_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'test-user-1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'test-user-2')
ON CONFLICT (discord_id) DO NOTHING;

-- Insert three seasons (past, present, future) with dynamic dates based on current quarter
WITH current_quarter AS (
  SELECT 
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    EXTRACT(QUARTER FROM CURRENT_DATE) as quarter
),
quarter_dates AS (
  SELECT 
    year,
    quarter,
    -- Past season (previous quarter)
    CASE 
      WHEN quarter = 1 THEN (year - 1, 4, 1, year - 1, 6, 30)
      WHEN quarter = 2 THEN (year, 1, 1, year, 3, 31)
      WHEN quarter = 3 THEN (year, 4, 1, year, 6, 30)
      WHEN quarter = 4 THEN (year, 7, 1, year, 9, 30)
    END as past_season,
    -- Present season (current quarter)
    CASE 
      WHEN quarter = 1 THEN (year, 1, 1, year, 3, 31)
      WHEN quarter = 2 THEN (year, 4, 1, year, 6, 30)
      WHEN quarter = 3 THEN (year, 7, 1, year, 9, 30)
      WHEN quarter = 4 THEN (year, 10, 1, year, 12, 31)
    END as present_season,
    -- Future season (next quarter)
    CASE 
      WHEN quarter = 1 THEN (year, 4, 1, year, 6, 30)
      WHEN quarter = 2 THEN (year, 7, 1, year, 9, 30)
      WHEN quarter = 3 THEN (year, 10, 1, year, 12, 31)
      WHEN quarter = 4 THEN (year + 1, 1, 1, year + 1, 3, 31)
    END as future_season
  FROM current_quarter
)
INSERT INTO seasons (name, start, "end", payout_formula) 
SELECT 
  'Past Season',
  MAKE_TIMESTAMP(
    (past_season).1::int, 
    (past_season).2::int, 
    (past_season).3::int, 
    0, 0, 0
  ),
  MAKE_TIMESTAMP(
    (past_season).4::int, 
    (past_season).5::int, 
    (past_season).6::int, 
    23, 59, 59
  ),
  '(ln($1/$2/2.0)/1.3)+1'
FROM quarter_dates
UNION ALL
SELECT 
  'Present Season',
  MAKE_TIMESTAMP(
    (present_season).1::int, 
    (present_season).2::int, 
    (present_season).3::int, 
    0, 0, 0
  ),
  MAKE_TIMESTAMP(
    (present_season).4::int, 
    (present_season).5::int, 
    (present_season).6::int, 
    23, 59, 59
  ),
  '(ln($1/$2/2.0)/1.3)+1'
FROM quarter_dates
UNION ALL
SELECT 
  'Future Season',
  MAKE_TIMESTAMP(
    (future_season).1::int, 
    (future_season).2::int, 
    (future_season).3::int, 
    0, 0, 0
  ),
  MAKE_TIMESTAMP(
    (future_season).4::int, 
    (future_season).5::int, 
    (future_season).6::int, 
    23, 59, 59
  ),
  '(ln($1/$2/2.0)/1.3)+1'
FROM quarter_dates
ON CONFLICT DO NOTHING;
