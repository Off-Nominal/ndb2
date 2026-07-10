import { config } from "@config";
import { fetchGuildMember, memberHasAnyRole } from "@domain/discord";

export type WebAdminAccessResult =
  | { ok: true }
  | { ok: false; reason: "not_in_guild" | "missing_role" }
  | { ok: false; reason: "discord_error"; error: unknown };

/** Whether `discordId` has host or mod roles in the portal guild. */
export async function resolveWebAdminAccess(
  discordId: string,
): Promise<boolean> {
  const result = await checkWebAdminAccess(discordId);
  return result.ok;
}

/** Detailed admin access check for middleware and tests. */
export async function checkWebAdminAccess(
  discordId: string,
): Promise<WebAdminAccessResult> {
  const portal = config.discord.webPortal;

  try {
    const member = await fetchGuildMember(
      portal.botToken,
      portal.guildId,
      discordId,
    );
    if (!member) {
      return { ok: false, reason: "not_in_guild" };
    }
    const allowed = memberHasAnyRole(member.roles, portal.adminRoleIds);
    if (!allowed) {
      return { ok: false, reason: "missing_role" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "discord_error", error };
  }
}
