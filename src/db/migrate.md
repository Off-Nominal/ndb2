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
