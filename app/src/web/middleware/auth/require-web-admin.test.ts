import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "@config";
import { fetchGuildMember } from "@domain/discord";
import type { WebAuthAuthenticated } from "./session";

const testAuth: WebAuthAuthenticated = {
  status: "authenticated",
  userId: "user-id",
  discordId: "discord-user-id",
  sessionId: "session-id",
  csrfToken: "csrf-token",
  lastDiscordAuthzAt: new Date(0),
};

vi.mock("./session", () => ({
  getWebAuth: vi.fn(() => testAuth),
}));

vi.mock("@domain/discord", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@domain/discord")>();
  return {
    ...actual,
    fetchGuildMember: vi.fn(),
  };
});

const mockedFetchGuildMember = vi.mocked(fetchGuildMember);

describe("requireWebAdmin", () => {
  beforeEach(() => {
    mockedFetchGuildMember.mockReset();
  });

  async function requestAdmin() {
    const { requireWebAdmin } = await import("./require-web-admin");
    const app = express();
    app.get("/admin", requireWebAdmin, (_req, res) => {
      res.status(200).send("ok");
    });
    return request(app).get("/admin");
  }

  it("allows access when member has host role", async () => {
    const hostRole = config.discord.webPortal.adminRoleIds[0];
    mockedFetchGuildMember.mockResolvedValue({ roles: [hostRole] });

    const res = await requestAdmin();

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });

  it("allows access when member has mod role", async () => {
    const modRole =
      config.discord.webPortal.adminRoleIds[1] ??
      config.discord.webPortal.adminRoleIds[0];
    mockedFetchGuildMember.mockResolvedValue({ roles: [modRole] });

    const res = await requestAdmin();

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });

  it("returns 403 when member has only a portal role", async () => {
    const portalOnlyRole = "987654321098765432";
    mockedFetchGuildMember.mockResolvedValue({ roles: [portalOnlyRole] });

    const res = await requestAdmin();

    expect(res.status).toBe(403);
    expect(res.text).toContain("Access denied");
    expect(res.text).toContain("hosts and mods");
  });

  it("returns 403 when member is not in guild", async () => {
    mockedFetchGuildMember.mockResolvedValue(null);

    const res = await requestAdmin();

    expect(res.status).toBe(403);
    expect(res.text).toContain("Access denied");
  });

  it("returns 502 when Discord lookup fails", async () => {
    mockedFetchGuildMember.mockRejectedValue(new Error("Discord down"));

    const res = await requestAdmin();

    expect(res.status).toBe(502);
    expect(res.text).toContain("Access check failed");
  });
});
