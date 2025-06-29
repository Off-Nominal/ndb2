/* Replace with your SQL commands */

ALTER TABLE votes
ADD UNIQUE (user_id, prediction_id)