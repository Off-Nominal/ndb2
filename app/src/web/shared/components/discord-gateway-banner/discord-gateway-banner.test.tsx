import { describe, expect, it } from "vitest";
import { DiscordGatewayBanner } from "./discord-gateway-banner";

describe("DiscordGatewayBanner", () => {
  it("renders nothing when connected", () => {
    expect(DiscordGatewayBanner({ status: "connected" })).toBeNull();
  });

  it("renders a status alert when connecting", () => {
    const html = DiscordGatewayBanner({ status: "connecting" });
    expect(html).not.toBeNull();
    expect(String(html)).toContain('role="status"');
    expect(String(html)).toContain("Connecting to Discord");
  });

  it("renders a status alert when disconnected", () => {
    const html = DiscordGatewayBanner({ status: "disconnected" });
    expect(html).not.toBeNull();
    expect(String(html)).toContain("temporarily unavailable");
  });
});
