import { UserSeed } from "../types";

export const INSERT_USERS_BULK_SQL = `
  INSERT INTO users (
    id,
    discord_id
  ) 
  SELECT * FROM UNNEST(
    $1::uuid[],
    $2::text[]
  )
`;

export interface UserInsertData {
  id: string;
  discord_id: string;
}

export function createUsersBulkInsertData(userSeeds: UserSeed[]): {
  ids: string[];
  discord_ids: string[];
} {
  return {
    ids: userSeeds.map((user) => user.id),
    discord_ids: userSeeds.map((user) => user.discord_id),
  };
}

export function insertUsersBulk(client: any, userSeeds: UserSeed[]) {
  const bulkData = createUsersBulkInsertData(userSeeds);
  return client.query(INSERT_USERS_BULK_SQL, [
    bulkData.ids,
    bulkData.discord_ids,
  ]);
}
