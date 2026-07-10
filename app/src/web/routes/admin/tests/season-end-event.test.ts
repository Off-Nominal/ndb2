import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountWeb } from "../../../mountWeb";

const resendSeasonEndWebhook = vi.fn();

vi.mock("@domain/seasons/resend-season-end-webhook", () => ({
  resendSeasonEndWebhook: (...args: unknown[]) => resendSeasonEndWebhook(...args),
}));

const testAuth = {
  status: "authenticated" as const,
  userId: "user-id",
  discordId: "discord-user-id",
  sessionId: "session-id",
  csrfToken: "csrf-token",
  lastDiscordAuthzAt: new Date(0),
};

vi.mock("../../../middleware/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../middleware/auth/session")>();
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

function mountAdminApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  mountWeb(app);
  return app;
}

describe("POST /admin/season-end-event", () => {
  beforeEach(() => {
    resendSeasonEndWebhook.mockReset();
  });

  it("returns an HTMX success fragment", async () => {
    resendSeasonEndWebhook.mockResolvedValueOnce({
      ok: true,
      season_id: 3,
      season_name: "Q1 2024",
    });

    const res = await request(mountAdminApp())
      .post("/admin/season-end-event")
      .set("HX-Request", "true")
      .set("X-CSRF-Token", "csrf-token")
      .type("form")
      .send({ season_id: "3" })
      .expect(200);

    expect(res.text).toContain('role="status"');
    expect(res.text).toContain("Q1 2024");
    expect(res.text).not.toContain("<html");
  });

  it("returns an HTMX error fragment when domain op fails", async () => {
    resendSeasonEndWebhook.mockResolvedValueOnce({
      ok: false,
      code: 90400,
      message: "Only past closed seasons can have their end webhook re-sent.",
    });

    const res = await request(mountAdminApp())
      .post("/admin/season-end-event")
      .set("HX-Request", "true")
      .set("X-CSRF-Token", "csrf-token")
      .type("form")
      .send({ season_id: "3" })
      .expect(400);

    expect(res.text).toContain('role="alert"');
    expect(res.text).toContain("Could not re-send webhook");
  });

  it("returns 403 when CSRF token is missing", async () => {
    const res = await request(mountAdminApp())
      .post("/admin/season-end-event")
      .set("HX-Request", "true")
      .type("form")
      .send({ season_id: "3" })
      .expect(403);

    expect(res.text).toContain("Invalid CSRF token");
    expect(resendSeasonEndWebhook).not.toHaveBeenCalled();
  });
});
