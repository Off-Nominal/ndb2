import type { DiscordMemberProfile } from "@domain/discord";
import { tryGetMemberProfile } from "@domain/discord";
import type { WebAuthAuthenticated } from "../middleware/auth/session";
import { resolveWebAdminAccess } from "./web-admin-access";

export type AuthenticatedShellData = {
  discordProfile: DiscordMemberProfile;
  showAdminNav: boolean;
};

/** Discord profile + admin nav visibility for authenticated page shells. */
export async function resolveAuthenticatedShell(
  auth: WebAuthAuthenticated,
): Promise<AuthenticatedShellData> {
  const [discordProfile, showAdminNav] = await Promise.all([
    tryGetMemberProfile(auth.discordId),
    resolveWebAdminAccess(auth.discordId),
  ]);
  return { discordProfile, showAdminNav };
}
