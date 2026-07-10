import type { DiscordGatewayStatus } from "@domain/discord";

export type DiscordGatewayBannerProps = {
  status: DiscordGatewayStatus;
};

/**
 * Non-blocking status strip when the discord.js gateway is not connected.
 * Renders nothing when {@link DiscordGatewayBannerProps.status} is `connected`.
 */
export function DiscordGatewayBanner(props: DiscordGatewayBannerProps): JSX.Element | null {
  if (props.status === "connected") {
    return null;
  }

  const message =
    props.status === "connecting"
      ? "Connecting to Discord. Display names and avatars may be incomplete until the connection is ready."
      : "Discord connection is temporarily unavailable. Display names and avatars may be incomplete until it reconnects.";

  return (
    <div class="[ discord-gateway-banner ]" role="status">
      <p class="discord-gateway-banner__message">{message}</p>
    </div>
  );
}
