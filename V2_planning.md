# High Level API Requirements

- Request/Response Validation
- Standard Response Format
- Better organization of routers/subrouters
- More granular data fetching approaches, more RESTFUL endpoints
- New TypeSafe Raw SQL strategy
- API Types as separate package that can be consumed by clients
- Better migration client

## Endpoint Requirements

POST /predictions - Add New Prediction
GET /predictions - Get All Predictions, with search queries, smaller data footprint
GET /predictions/:prediction_id - Get Specific Prediction
PATCH /predictions/:prediction_id - Update Status on Prediction (Retire, Snooze, trigger)
GET /predictions/:prediction_id/bets - Get all Bets on Prediction
POST /predictions/:prediction_id/bets - Add Bet to Prediction
POST /predictions/:prediction_id/snooze_checks/:snooze_check_id - Add Snooze Vote to Check
GET /predictions/:prediction_id/votes - Get all Votes on Prediction
POST /predictions/:prediction_id/votes - Add Vote to Prediction

GET /results - Get leaders/results with season query param and type param (bets, predictions, points)

GET /seasons - Get all season information
GET /seasons/:season_id - Get One season infomation

GET /users/discord/:discord_id/ - Get One user with achievements, pennants, trophies plus meta info
GET /users/discord/:discord_id/predictions - Get all predictions by user
GET /users/discord/:discord_id/scores - Get Scores with query params for season
