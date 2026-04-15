import type { PredictionSeed } from "@offnominal/ndb2-db";
import * as C from "./constants";

/** Minimal open date-driven prediction with two endorsers (IDs 1 & 2 in old fixtures). */
export function predictionSimpleDateWithBets(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "A simple date-driven prediction",
    driver: "date",
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
  };
}

/** Closed + judged date prediction with two bets and two votes (ID 2 in old fixtures). */
export function predictionClosedJudgedDate(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "A simple closed date-driven prediction",
    driver: "date",
    baseDate: { quarter: "past", days: 25 },
    due: { days: 40 },
    closed: { days: 40 },
    triggered: { days: 40 },
    judged: { days: 41 },
    bets: [
      {
        user_id: C.USER_1_ID,
        created: { minutes: 5 },
        endorsed: true,
      },
      {
        user_id: C.USER_2_ID,
        created: { minutes: 15 },
        endorsed: false,
      },
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
  };
}

/** Full event-driven judged prediction with snooze check + votes (ID 3). */
export function predictionEventJudgedWithSnooze(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "A simple closed event-driven prediction",
    driver: "event",
    baseDate: { quarter: "past", days: 25 },
    check_date: { days: 20 },
    closed: { days: 27 },
    triggered: { days: 27 },
    judged: { days: 28 },
    bets: [
      {
        user_id: C.USER_1_ID,
        created: { days: 0 },
        endorsed: true,
      },
      {
        user_id: C.USER_2_ID,
        created: { days: 1, minutes: 5 },
        endorsed: false,
      },
    ],
    votes: [
      {
        user_id: C.USER_1_ID,
        voted: { days: 0, minutes: 5 },
        vote: true,
      },
      {
        user_id: C.USER_2_ID,
        voted: { days: 0, minutes: 15 },
        vote: false,
      },
      {
        user_id: C.USER_3_ID,
        voted: { days: 0, minutes: 25 },
        vote: true,
      },
    ],
    checks: [
      {
        checked: { days: 0 },
        closed: { days: 0, minutes: 30 },
        votes: [
          {
            user_id: C.USER_1_ID,
            value: 7,
            created: { days: 0, minutes: 5 },
          },
          {
            user_id: C.USER_2_ID,
            value: 7,
            created: { days: 0, minutes: 15 },
          },
          {
            user_id: C.USER_3_ID,
            value: 7,
            created: { days: 0, minutes: 25 },
          },
        ],
      },
    ],
  };
}

export function predictionOpen(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with open status",
    driver: "date",
    baseDate: { days: 0 },
    due: { days: 25 },
  };
}

export function predictionChecking(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with checking status",
    driver: "date",
    baseDate: { quarter: "past", days: 10 },
    due: { days: 20 },
    checks: [{ checked: { days: 0 } }],
  };
}

export function predictionRetired(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with retired status",
    driver: "date",
    baseDate: { quarter: "past", days: 10 },
    due: { days: 20 },
    retired: { days: 5 },
  };
}

export function predictionClosedNotJudged(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with closed status",
    driver: "date",
    baseDate: { quarter: "past", days: 25 },
    due: { days: 40 },
    closed: { days: 40 },
    triggered: { days: 40 },
    votes: [
      {
        user_id: C.USER_1_ID,
        voted: { days: 40, minutes: 5 },
        vote: true,
      },
    ],
  };
}

export function predictionSuccessful(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with successful status",
    driver: "date",
    baseDate: { quarter: "past", days: 25 },
    due: { days: 40 },
    closed: { days: 40 },
    triggered: { days: 40 },
    judged: { days: 41 },
    votes: [
      {
        user_id: C.USER_1_ID,
        voted: { days: 40, minutes: 5 },
        vote: true,
      },
      {
        user_id: C.USER_2_ID,
        voted: { days: 40, minutes: 10 },
        vote: true,
      },
      {
        user_id: C.USER_3_ID,
        voted: { days: 40, minutes: 15 },
        vote: false,
      },
    ],
  };
}

export function predictionFailed(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction with failed status",
    driver: "date",
    baseDate: { quarter: "past", days: 25 },
    due: { days: 40 },
    closed: { days: 40 },
    triggered: { days: 40 },
    judged: { days: 41 },
    votes: [
      {
        user_id: C.USER_1_ID,
        voted: { days: 40, minutes: 5 },
        vote: false,
      },
      {
        user_id: C.USER_2_ID,
        voted: { days: 40, minutes: 10 },
        vote: false,
      },
      {
        user_id: C.USER_3_ID,
        voted: { days: 40, minutes: 15 },
        vote: true,
      },
    ],
  };
}

export function predictionEventOpen(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test event-driven prediction with open status (PATCH snooze tests)",
    driver: "event",
    baseDate: { days: 0 },
    check_date: { days: 25 },
  };
}

export function predictionEventRetired(id: number): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test event-driven prediction with retired status (PATCH snooze tests)",
    driver: "event",
    baseDate: { quarter: "past", days: 10 },
    check_date: { days: 20 },
    retired: { days: 5 },
  };
}

/** GET /predictions/:id detail assertions (ids 1–3). */
export function seedForGetPredictionById(): PredictionSeed[] {
  return [
    predictionSimpleDateWithBets(1),
    predictionClosedJudgedDate(2),
    predictionEventJudgedWithSnooze(3),
  ];
}

/** GET /predictions/search — one successful row for `status=successful`. */
export function seedForPredictionsSearch(): PredictionSeed[] {
  return [predictionSuccessful(1)];
}

/** PATCH retire + shared status matrix (second open id 7 for emit test after id 1 is retired). */
export function seedForPatchRetire(): PredictionSeed[] {
  return [
    predictionOpen(1),
    predictionChecking(2),
    predictionRetired(3),
    predictionClosedNotJudged(4),
    predictionSuccessful(5),
    predictionFailed(6),
    predictionOpen(7),
  ];
}

/** DELETE trigger — open, checking, retired, successful, failed, closed (old 4–9). */
export function seedForDeleteTrigger(): PredictionSeed[] {
  return [
    predictionOpen(1),
    predictionChecking(2),
    predictionRetired(3),
    predictionClosedNotJudged(4),
    predictionSuccessful(5),
    predictionFailed(6),
  ];
}

/** DELETE judgement rejects — old 4–8. */
export function seedForDeleteJudgementRejects(): PredictionSeed[] {
  return [
    predictionOpen(1),
    predictionChecking(2),
    predictionRetired(3),
    predictionClosedNotJudged(4),
    predictionSuccessful(5),
  ];
}

/** PATCH snooze — open event (1) + retired event (2). */
export function seedForPatchSnooze(): PredictionSeed[] {
  return [predictionEventOpen(1), predictionEventRetired(2)];
}

/** POST bets — open with bets (1), closed judged (2), open no duplicate (3). */
export function seedForPostBets(): PredictionSeed[] {
  return [
    predictionSimpleDateWithBets(1),
    predictionClosedJudgedDate(2),
    predictionOpen(3),
  ];
}

/** POST votes — open (1), closed with vote (2). */
export function seedForPostVotes(): PredictionSeed[] {
  return [predictionOpen(1), predictionClosedNotJudged(2)];
}

/** POST snooze check vote — checking (1) + open (2) for non-checking rejection. */
export function seedForSnoozeCheckVote(): PredictionSeed[] {
  return [predictionChecking(1), predictionOpen(2)];
}
