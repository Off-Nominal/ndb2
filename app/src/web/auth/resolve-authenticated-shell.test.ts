import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebAuthAuthenticated } from "../middleware/auth/session";
import { resolveAuthenticatedShell } from "./resolve-authenticated-shell";

const testAuth: WebAuthAuthenticated = {
  status: "authenticated",
  userId: "user-id",
  discordId: "100000000000000001",
  sessionId: "session-id",
  csrfToken: "csrf",
  lastDiscordAuthzAt: new Date(0),
};

const mockProfile = {
  displayName: "Predictor",
  avatarUrl: "https://cdn.example/avatar.png",
};

vi.mock("@domain/discord", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@domain/discord")>();
  return {
    ...actual,
    tryGetMemberProfile: vi.fn(),
  };
});

vi.mock("./web-admin-access", () => ({
  resolveWebAdminAccess: vi.fn(),
}));

import { tryGetMemberProfile } from "@domain/discord";
import { resolveWebAdminAccess } from "./web-admin-access";

const mockedTryGetMemberProfile = vi.mocked(tryGetMemberProfile);
const mockedResolveWebAdminAccess = vi.mocked(resolveWebAdminAccess);

describe("resolveAuthenticatedShell", () => {
  beforeEach(() => {
    mockedTryGetMemberProfile.mockReset();
    mockedResolveWebAdminAccess.mockReset();
    mockedTryGetMemberProfile.mockResolvedValue(mockProfile);
    mockedResolveWebAdminAccess.mockResolvedValue(false);
  });

  it("loads profile and admin nav in parallel", async () => {
    mockedResolveWebAdminAccess.mockResolvedValue(true);

    const result = await resolveAuthenticatedShell(testAuth);

    expect(result).toEqual({
      discordProfile: mockProfile,
      showAdminNav: true,
    });
    expect(mockedTryGetMemberProfile).toHaveBeenCalledWith(testAuth.discordId);
    expect(mockedResolveWebAdminAccess).toHaveBeenCalledWith(testAuth.discordId);
  });

  it("returns showAdminNav false when admin access is denied", async () => {
    const result = await resolveAuthenticatedShell(testAuth);

    expect(result.showAdminNav).toBe(false);
    expect(result.discordProfile).toBe(mockProfile);
  });
});
