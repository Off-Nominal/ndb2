import { addUser, getUserByDiscordId } from "./users.queries";

export default {
  getByDiscordId:
    (dbClient: any) =>
    async (discord_id: string): Promise<{ id: string; discord_id: string }> => {
      const [existingUser] = await getUserByDiscordId.run(
        { discord_id },
        dbClient
      );

      if (existingUser) {
        return existingUser;
      }

      const [newUser] = await addUser.run({ discord_id }, dbClient);
      return newUser;
    },
};
