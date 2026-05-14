import type { PoolClient } from "pg";
import { describe, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import pool from "@data/db";
import predictions from "@data/queries/predictions";
import { placeBet } from "@domain/bets/place-bet";
import { useEphemeralDb } from "../../test/with-ephemeral-db";
import { defaultUsers } from "../../test/factories/users";
import { defaultPastCurrentFutureSeasons } from "../../test/factories/seasons";
import { prediction } from "../../test/factories/predictions";
import * as C from "../../test/factories/constants";

useEphemeralDb({
  users: defaultUsers(),
  seasons: defaultPastCurrentFutureSeasons(),
  predictions: [
    prediction(1, {
      text: "open with bets",
      baseDate: { quarter: "past", days: 20 },
      due: { days: 10 },
      bets: [
        {
          user_id: C.USER_1_ID,
          created: { days: 0 },
          endorsed: true,
        },
        {
          user_id: C.USER_2_ID,
          created: { days: 1 },
          endorsed: true,
        },
      ],
    }),
    prediction(2, {
      text: "closed judged",
      baseDate: { quarter: "past", days: 25 },
      due: { days: 40 },
      closed: { days: 40 },
      triggered: { days: 40 },
      judged: { days: 41 },
      bets: [
        { user_id: C.USER_1_ID, created: { minutes: 5 }, endorsed: true },
        { user_id: C.USER_2_ID, created: { minutes: 15 }, endorsed: false },
      ],
      votes: [
        {
          user_id: C.USER_1_ID,
          voted: { days: 40, minutes: 5 },
          vote: true,
        },
        {
          user_id: C.USER_2_ID,
          voted: { days: 40, minutes: 15 },
          vote: false,
        },
      ],
    }),
    prediction(3, {
      text: "open no dup bet",
      baseDate: { days: 0 },
      due: { days: 25 },
    }),
    prediction(4, {
      text: "open with stale bet outside change window",
      baseDate: { days: 0 },
      due: { days: 25 },
      bets: [
        {
          user_id: C.USER_3_ID,
          /** Relative to prediction `created_date`; far enough in the past to exceed the update window (hours). */
          created: { days: -5 },
          endorsed: true,
        },
      ],
    }),
    prediction(5, {
      text: "open with recent bet for flip inside window",
      baseDate: { days: 0 },
      due: { days: 25 },
      bets: [
        {
          user_id: C.USER_2_ID,
          created: { hours: -2 },
          endorsed: true,
        },
      ],
    }),
  ],
});

async function withClient<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

describe("placeBet", () => {
  it("returns PREDICTION_NOT_FOUND when the prediction does not exist", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 999_999,
        discord_id: C.DISCORD_1,
        endorsed: true,
      }),
    );

    expect(result).toEqual({
      ok: false,
      code: API.Errors.PREDICTION_NOT_FOUND,
      message: "Prediction with id 999999 does not exist.",
    });
  });

  it("returns INVALID_PREDICTION_STATUS when the prediction is not open", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 2,
        discord_id: C.DISCORD_3,
        endorsed: true,
      }),
    );

    expect(result).toEqual({
      ok: false,
      code: API.Errors.INVALID_PREDICTION_STATUS,
      message: "Bets can only be placed on open predictions.",
    });
  });

  it("returns BETS_NO_CHANGE when the user repeats the same endorsement", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 1,
        discord_id: C.DISCORD_1,
        endorsed: true,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(API.Errors.BETS_NO_CHANGE);
      expect(result.message).toContain("endorsed");
      expect(result.message).toContain("No change necessary");
    }
  });

  it("returns BETS_UNCHANGEABLE when flipping a bet past the update window", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 4,
        discord_id: C.DISCORD_3,
        endorsed: false,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(API.Errors.BETS_UNCHANGEABLE);
      expect(result.message).toContain("allowable time window");
    }
  });

  it("creates a new bet and returns outcome created", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 3,
        discord_id: C.DISCORD_1,
        endorsed: true,
      }),
    );

    expect(result).toEqual({ ok: true, outcome: "created" });

    const loaded = await withClient((client) =>
      predictions.getById(client)(3),
    );
    expect(
      loaded?.bets.some((b) => b.better.discord_id === C.DISCORD_1),
    ).toBe(true);
  });

  it("updates an existing bet and returns outcome changed", async () => {
    const result = await withClient((client) =>
      placeBet(client, {
        prediction_id: 5,
        discord_id: C.DISCORD_2,
        endorsed: false,
      }),
    );

    expect(result).toEqual({ ok: true, outcome: "changed" });

    const loaded = await withClient((client) =>
      predictions.getById(client)(5),
    );
    const user2Bet = loaded?.bets.find((b) => b.better.discord_id === C.DISCORD_2);
    expect(user2Bet?.endorsed).toBe(false);
  });
});
