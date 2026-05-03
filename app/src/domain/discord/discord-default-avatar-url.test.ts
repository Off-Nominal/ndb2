import { describe, expect, it } from "vitest";
import {
  DISCORD_EMBED_AVATAR_PLACEHOLDER_URL,
  discordDefaultEmbedAvatarUrl,
} from "./discord-default-avatar-url";

describe("discordDefaultEmbedAvatarUrl", () => {
  it("returns null for empty or non-numeric ids", () => {
    expect(discordDefaultEmbedAvatarUrl("")).toBeNull();
    expect(discordDefaultEmbedAvatarUrl("abc")).toBeNull();
    expect(discordDefaultEmbedAvatarUrl("12a34")).toBeNull();
  });

  it("trims whitespace before parsing", () => {
    expect(discordDefaultEmbedAvatarUrl("  123456789012345678  ")).toBe(
      discordDefaultEmbedAvatarUrl("123456789012345678"),
    );
  });

  it("uses (id >> 22) % 6 for the embed slot (Discord pomelo / new-username rules)", () => {
    expect(discordDefaultEmbedAvatarUrl("123456789012345678")).toBe(
      "https://cdn.discordapp.com/embed/avatars/0.png",
    );
    expect(discordDefaultEmbedAvatarUrl("80351110224678912")).toBe(
      "https://cdn.discordapp.com/embed/avatars/5.png",
    );
  });
});

describe("DISCORD_EMBED_AVATAR_PLACEHOLDER_URL", () => {
  it("matches Discord CDN embed/avatars/0", () => {
    expect(DISCORD_EMBED_AVATAR_PLACEHOLDER_URL).toBe(
      "https://cdn.discordapp.com/embed/avatars/0.png",
    );
  });
});
