# Notes

## Users

- Mapping usernames to Discord IDs caught some duplicate users and combined their scores, correcting mistakes where users were split across different usernames and scores
- Some users (6) were unfindable - None of them made any predictions, but they did endorse/undorse. These bets will be skipped. Since Legacy NDB has no odds, the absense of these bets will have virtually no impact.

## Predictions

- Some older predictions which had no due date or somehow missed being checked will be retroactively triggered, so we will have some old votes to figure out

## Bets

- The new DB structure does not support "doubling down" or any kind of multiple bets on the same prediction by a single user. The migration takes the first such bet found and ignores any duplicates. This may affect your legacy score if you doubled down or tried to add a second bet.

## Votes

- Legacy NDB did not capture who voted, only totals, but the new DB structure does. During the migration, a batch of fake users was created to fill this structure out. You will see "Unknown Users" or <@0000000000000001> in voting lists for legacy prediction details. In addition, your vote count in the `/predict score` command will not reflect any votes from the legacy system.

## Migration Checklist

### Cut Over

- Power down and confirm NDB1 is offline
  - Does Acronym bot still work?
  - Do !predict, !ndb, !nostradambot, !endorse and !undorse return redirect messages and not add data?- Test all nine commands
- Execute Migration Script
  - `npm run clear && tsc && NODE_ENV=production node ./dist/db/migrate.js`
  - Copy review table to notes
  - Confirm data is live
  - Check seasons information for correctness
  - Spot check three predictions
- Merge PR for NDB2, deploy
- Communicate

### Later

- Begin cleaning up predictions
- Turn schedule back on with API

#### AUTO CLOSE

```sql
-- quick view
SELECT prediction_id, created_date, due_date, closed_date, judged_date, status, text, predictor_id from enhanced_predictions ep WHERE ep.prediction_id =

-- Set to vote
UPDATE predictions SET triggerer_id = '', closed_date = '', triggered_date = NOW() WHERE predictions.id = '';

-- Auto close
BEGIN;
UPDATE predictions SET triggerer_id = 'fd004038-e1e9-4c20-b3ca-0fe6b99cebe9', closed_date = '2020-07-30', triggered_date = NOW() WHERE predictions.id = 172;
INSERT INTO votes (
    user_id,
    prediction_id,
    vote,
    voted_date
  ) VALUES (
    '8397e07c-b6b7-4672-81fe-4d9e087e69f1',
    172,
    true,
    NOW()
  );
UPDATE predictions SET judged_date = NOW() WHERE predictions.id = 172;
COMMIT;

-- Update due date
UPDATE predictions SET due_date = '' WHERE prediction_id = ''
```
