export namespace APIUsers {
  export type User = {
    id: string;
    discord_id: string;
  };

  export type GetUserByDiscordId = User;

  export type AddUser = User;
}
