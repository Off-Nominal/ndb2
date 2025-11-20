/* @name getUserByDiscordId */
SELECT id, discord_id 
  FROM users
  WHERE discord_id = :discord_id!;

/* @name addUser */
INSERT INTO users (discord_id) 
  VALUES (:discord_id!) 
  RETURNING id, discord_id;