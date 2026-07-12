import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountWeb } from "../../../mountWeb";

const createSeason = vi.fn();
const getLatestForCreate = vi.fn();

vi.mock("../create-season", () => ({
  createSeason: (...args: unknown[]) => createSeason(...args),
}));

vi.mock("@data/queries/seasons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@data/queries/seasons")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      getLatestForCreate: () => getLatestForCreate,
    },
  };
});

vi.mock("../propose-next-season", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../propose-next-season")>();
  return {
    ...actual,
    proposeNextSeason: () => ({
      start: new Date("2026-10-01T00:00:00.000Z"),
      end: new Date("2027-01-01T00:00:00.000Z"),
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    }),
  };
});

const testAuth = {
  status: "authenticated" as const,
  userId: "user-id",
  discordId: "discord-user-id",
  sessionId: "session-id",
  csrfToken: "csrf-token",
  lastDiscordAuthzAt: new Date(0),
};

vi.mock("../../../middleware/auth/session", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../middleware/auth/session")>();
  return {
    ...actual,
    getWebAuth: vi.fn(() => testAuth),
  };
});

vi.mock("../../../middleware/auth/require-web-admin", () => ({
  requireWebAdmin: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

vi.mock("@data/db/getDbClient", () => ({
  getDbClient: vi.fn(async () => ({})),
}));

function mountAdminApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  mountWeb(app);
  return app;
}

describe("POST /admin/seasons", () => {
  beforeEach(() => {
    createSeason.mockReset();
    getLatestForCreate.mockReset();
    getLatestForCreate.mockResolvedValue({
      id: 47,
      name: "Ignition",
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-10-01T00:00:00.000Z",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      wager_cap: 92,
      closed: false,
    });
  });

  it("redirects via HX-Redirect on HTMX success", async () => {
    createSeason.mockResolvedValueOnce({
      ok: true,
      season_id: 48,
      season_name: "Ignition II",
    });

    const res = await request(mountAdminApp())
      .post("/admin/seasons")
      .set("HX-Request", "true")
      .set("X-CSRF-Token", "csrf-token")
      .type("form")
      .send({
        name: "Ignition II",
        start: "2026-10-01T00:00",
        end: "2027-01-01T00:00",
        payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      })
      .expect(200);

    expect(res.headers["hx-redirect"]).toBe("/admin");
    expect(createSeason).toHaveBeenCalled();
  });

  it("returns an HTMX error fragment when domain op fails", async () => {
    createSeason.mockResolvedValueOnce({
      ok: false,
      code: 90001,
      message: "Season window overlaps existing season “Ignition” (#47).",
    });

    const res = await request(mountAdminApp())
      .post("/admin/seasons")
      .set("HX-Request", "true")
      .set("X-CSRF-Token", "csrf-token")
      .type("form")
      .send({
        name: "Overlap",
        start: "2026-09-01T00:00",
        end: "2026-12-01T00:00",
        payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      })
      .expect(400);

    expect(res.text).toContain('role="alert"');
    expect(res.text).toContain("Could not create season");
  });

  it("returns 403 when CSRF token is missing", async () => {
    const res = await request(mountAdminApp())
      .post("/admin/seasons")
      .set("HX-Request", "true")
      .type("form")
      .send({
        name: "Ignition II",
        start: "2026-10-01T00:00",
        end: "2027-01-01T00:00",
        payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      })
      .expect(403);

    expect(res.text).toContain("Invalid CSRF token");
    expect(createSeason).not.toHaveBeenCalled();
  });

  it("returns an HTMX error fragment for invalid form data", async () => {
    const res = await request(mountAdminApp())
      .post("/admin/seasons")
      .set("HX-Request", "true")
      .set("X-CSRF-Token", "csrf-token")
      .type("form")
      .send({
        name: "",
        start: "2026-10-01T00:00",
        end: "2027-01-01T00:00",
        payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      })
      .expect(400);

    expect(res.text).toContain("Invalid season");
    expect(createSeason).not.toHaveBeenCalled();
  });
});
