import { randomUUID } from "crypto";
import { addUser, getUserByDiscordId, IAddUserParams } from "./users.queries";
import { IDatabaseConnection } from "@pgtyped/runtime/lib/tag";

const add = (
  params: Omit<IAddUserParams, "id">,
  dbConnection: IDatabaseConnection
) => {
  const id = randomUUID();
  return addUser.run({ ...params, id }, dbConnection);
};

export const users = {
  add,
  getByDiscordId: getUserByDiscordId.run,
};
