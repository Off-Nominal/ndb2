import type { UserSeed } from "@offnominal/ndb2-db";
import * as C from "./constants";

export function testUsersThree(): UserSeed[] {
  return [
    {
      id: C.USER_1_ID,
      discord_id: C.DISCORD_1,
      notes: "Test User 1",
    },
    {
      id: C.USER_2_ID,
      discord_id: C.DISCORD_2,
      notes: "Test User 2",
    },
    {
      id: C.USER_3_ID,
      discord_id: C.DISCORD_3,
      notes: "Test User 3",
    },
  ];
}
