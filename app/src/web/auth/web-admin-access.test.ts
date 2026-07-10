import { beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "@config";
import { fetchGuildMember } from "@domain/discord";
import { checkWebAdminAccess, resolveWebAdminAccess } from "./web-admin-access";

vi.mock("@domain/discord", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@domain/discord")>();
  return {
    ...actual,
    fetchGuildMember: vi.fn(),
  };
});

const mockedFetchGuildMember = vi.mocked(fetchGuildMember);

describe("checkWebAdminAccess", () => {
  beforeEach(() => {
    mockedFetchGuildMember.mockReset();
  });

  it("returns ok when member has host role", async () => {
    const hostRole = config.discord.webPortal.adminRoleIds[0];
    mockedFetchGuildMember.mockResolvedValue({ roles: [hostRole] });

    await expect(checkWebAdminAccess("discord-user")).resolves.toEqual({
      ok: true,
    });
  });

  it("returns ok when member has mod role", async () => {
    const modRole =
      config.discord.webPortal.adminRoleIds[1] ??
      config.discord.webPortal.adminRoleIds[0];
    mockedFetchGuildMember.mockResolvedValue({ roles: [modRole] });

    await expect(checkWebAdminAccess("discord-user")).resolves.toEqual({
      ok: true,
    });
  });

  it("returns missing_role when member lacks admin roles", async () => {
    mockedFetchGuildMember.mockResolvedValue({ roles: ["987654321098765432"] });

    await expect(checkWebAdminAccess("discord-user")).resolves.toEqual({
      ok: false,
      reason: "missing_role",
    });
  });

  it("returns not_in_guild when member is absent", async () => {
    mockedFetchGuildMember.mockResolvedValue(null);

    await expect(checkWebAdminAccess("discord-user")).resolves.toEqual({
      ok: false,
      reason: "not_in_guild",
    });
  });

  it("returns discord_error when lookup throws", async () => {
    const err = new Error("Discord down");
    mockedFetchGuildMember.mockRejectedValue(err);

    await expect(checkWebAdminAccess("discord-user")).resolves.toEqual({
      ok: false,
      reason: "discord_error",
      error: err,
    });
  });

  it("calls fetchGuildMember with portal config", async () => {
    mockedFetchGuildMember.mockResolvedValue(null);

    await checkWebAdminAccess("discord-user-123");

    expect(mockedFetchGuildMember).toHaveBeenCalledWith(
      config.discord.webPortal.botToken,
      config.discord.webPortal.guildId,
      "discord-user-123",
    );
  });
});

describe("resolveWebAdminAccess", () => {
  beforeEach(() => {
    mockedFetchGuildMember.mockReset();
  });

  it("returns true when checkWebAdminAccess succeeds", async () => {
    const hostRole = config.discord.webPortal.adminRoleIds[0];
    mockedFetchGuildMember.mockResolvedValue({ roles: [hostRole] });

    await expect(resolveWebAdminAccess("discord-user")).resolves.toBe(true);
  });

  it("returns false when checkWebAdminAccess denies", async () => {
    mockedFetchGuildMember.mockResolvedValue({ roles: ["987654321098765432"] });

    await expect(resolveWebAdminAccess("discord-user")).resolves.toBe(false);
  });
});
