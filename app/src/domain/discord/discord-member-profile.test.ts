import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GuildMember } from "discord.js";

const ctx = vi.hoisted(() => {
  const fetchMember = vi.fn();

  const guild = {
    members: {
      cache: {
        get: vi.fn((_id: string) => undefined),
      },
      fetch: fetchMember,
    },
  };

  const fetchUser = vi.fn();

  const getClient = vi.fn(() => ({
    guilds: {
      cache: {
        get: (id: string) => (id === "g-test" ? guild : undefined),
      },
      fetch: vi.fn(async () => guild),
    },
    users: {
      fetch: fetchUser,
    },
  }));

  return { fetchMember, fetchUser, guild, getClient };
});

vi.mock("./discord-js-client.js", () => ({
  getDiscordGatewayClient: () => ctx.getClient(),
}));

vi.mock("@config", () => ({
  config: {
    discord: {
      webPortal: { guildId: "g-test" },
    },
  },
}));

import {
  getMemberProfiles,
  getMemberProfilesGuildOnly,
  guildMemberToProfile,
  userToProfile,
} from "./discord-member-profile.js";

describe("guildMemberToProfile", () => {
  it("maps displayName and passes size 128 to displayAvatarURL", () => {
    const avatarSpy = vi.fn(() => "https://cdn.example/a.webp");
    const profile = guildMemberToProfile({
      displayName: "Nick Here",
      displayAvatarURL: avatarSpy,
    });
    expect(profile.displayName).toBe("Nick Here");
    expect(profile.avatarUrl).toBe("https://cdn.example/a.webp");
    expect(avatarSpy).toHaveBeenCalledWith({ size: 128 });
  });
});

describe("userToProfile", () => {
  it("uses placeholder when display name is empty", () => {
    const profile = userToProfile({
      displayName: null,
      displayAvatarURL: () => "https://cdn.example/x.png",
    });
    expect(profile.displayName).toBe("(unknown user)");
  });
});

describe("getMemberProfiles", () => {
  beforeEach(() => {
    ctx.fetchMember.mockReset();
    ctx.fetchMember.mockImplementation(
      async ({ user }: { user: string | string[] }) => {
        const ids = Array.isArray(user) ? user : [user];
        const m = new Map<string, Pick<GuildMember, "displayName" | "displayAvatarURL">>();
        for (const id of ids) {
          m.set(id, {
            displayName: `user-${id}`,
            displayAvatarURL: (options?: { size?: number }) =>
              `https://cdn.example/${id}?s=${options?.size ?? 0}`,
          });
        }
        return m;
      },
    );
    ctx.fetchUser.mockReset();
    vi.mocked(ctx.guild.members.cache.get).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("dedupes discord ids so each guild member is fetched at most once", async () => {
    const map = await getMemberProfiles(["9", "9", "8", "8", "9"]);

    expect(ctx.fetchMember).toHaveBeenCalledTimes(1);
    expect(ctx.fetchMember).toHaveBeenCalledWith({ user: ["9", "8"] });
    expect(ctx.fetchUser).not.toHaveBeenCalled();
    expect(map.get("9")?.displayName).toBe("user-9");
    expect(map.get("8")?.displayName).toBe("user-8");
  });

  it("falls back to client.users.fetch when not in guild", async () => {
    ctx.fetchMember.mockResolvedValue(new Map() as never);
    ctx.fetchUser.mockImplementation(async (id: string) => ({
      id,
      globalName: `global-${id}`,
      username: `u_${id}`,
      displayAvatarURL: (options?: { size?: number }) =>
        `https://global.example/${id}?s=${options?.size ?? 0}`,
    }));

    const map = await getMemberProfiles(["22", "22"]);

    expect(ctx.fetchMember).toHaveBeenCalled();
    expect(ctx.fetchUser).toHaveBeenCalledTimes(1);
    expect(ctx.fetchUser).toHaveBeenCalledWith("22");
    expect(map.get("22")?.displayName).toBe("global-22");
    expect(map.get("22")?.avatarUrl).toContain("global.example/22");
    expect(map.get("22")?.avatarUrl).toContain("s=128");
  });

  it("returns null when guild member and users.fetch both fail", async () => {
    ctx.fetchMember.mockResolvedValue(new Map() as never);
    ctx.fetchUser.mockRejectedValue(new Error("UserManager.fetch failed"));

    const map = await getMemberProfiles(["55"]);

    expect(map.get("55")).toBeNull();
  });
});

describe("getMemberProfilesGuildOnly", () => {
  beforeEach(() => {
    ctx.fetchMember.mockReset();
    ctx.fetchMember.mockImplementation(
      async ({ user }: { user: string | string[] }) => {
        const ids = Array.isArray(user) ? user : [user];
        const m = new Map<string, Pick<GuildMember, "displayName" | "displayAvatarURL">>();
        for (const id of ids) {
          m.set(id, {
            displayName: `user-${id}`,
            displayAvatarURL: (options?: { size?: number }) =>
              `https://cdn.example/${id}?s=${options?.size ?? 0}`,
          });
        }
        return m;
      },
    );
    ctx.fetchUser.mockReset();
    vi.mocked(ctx.guild.members.cache.get).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not call users.fetch when id is absent from guild bulk collection", async () => {
    ctx.fetchMember.mockResolvedValue(new Map() as never);

    const map = await getMemberProfilesGuildOnly(["44"]);

    expect(ctx.fetchUser).not.toHaveBeenCalled();
    expect(map.get("44")).toBeNull();
  });

  it("maps guild bulk members without users.fetch", async () => {
    const map = await getMemberProfilesGuildOnly(["9", "8"]);

    expect(ctx.fetchUser).not.toHaveBeenCalled();
    expect(map.get("9")?.displayName).toBe("user-9");
    expect(map.get("8")?.avatarUrl).toContain("cdn.example");
  });
});