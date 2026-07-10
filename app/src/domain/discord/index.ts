export {
  DISCORD_EMBED_AVATAR_PLACEHOLDER_URL,
  discordDefaultEmbedAvatarUrl,
} from "./discord-default-avatar-url";
export {
  fetchGuildMember,
  type GuildMemberSummary,
} from "./discord-gateway";
export {
  startDiscordGatewayClient,
  connectDiscordGatewayInBackground,
  stopDiscordGatewayClient,
  getDiscordGatewayClient,
  isDiscordGatewayReady,
} from "./discord-js-client";
export {
  guildMemberToProfile,
  userToProfile,
  getMemberProfile,
  getMemberProfilesGuildOnly,
  getPortalGuild,
  memberProfileFromDiscordUsersCache,
  prefetchUserProfileFallback,
  resolveGuildMember,
  resolveUserProfileFallback,
  type DiscordMemberProfile,
  type GuildMemberProfileSource,
  type UserProfileSource,
} from "./discord-member-profile";
export { collectWebPortalRoleIdsFromEnv } from "@config";
