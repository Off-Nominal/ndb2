/** True when `memberRoleIds` includes at least one id from `allowedRoleIds`. */
export function memberHasAnyRole(
  memberRoleIds: string[],
  allowedRoleIds: string[],
): boolean {
  return allowedRoleIds.some((id) => memberRoleIds.includes(id));
}
