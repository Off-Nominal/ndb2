import { describe, expect, it } from "vitest";
import { memberHasAnyRole } from "./member-has-any-role";

describe("memberHasAnyRole", () => {
  const hostRole = "111";
  const modRole = "222";
  const otherRole = "333";

  it("returns true when member has a host role", () => {
    expect(memberHasAnyRole([hostRole, otherRole], [hostRole, modRole])).toBe(
      true,
    );
  });

  it("returns true when member has a mod role", () => {
    expect(memberHasAnyRole([modRole], [hostRole, modRole])).toBe(true);
  });

  it("returns false when member has only non-admin roles", () => {
    expect(memberHasAnyRole([otherRole], [hostRole, modRole])).toBe(false);
  });

  it("returns false when member has no roles", () => {
    expect(memberHasAnyRole([], [hostRole, modRole])).toBe(false);
  });
});
