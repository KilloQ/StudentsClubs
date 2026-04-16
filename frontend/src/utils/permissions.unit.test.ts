import { describe, expect, it } from "vitest";

import { canJoinOrLeaveClub, canManageClubs, isAdmin } from "./permissions";

describe("permissions utils", () => {
  it("allows student to join and leave club", () => {
    expect(canJoinOrLeaveClub({ id: 1, username: "s", full_name: "S", is_teacher: false, role: "student" })).toBe(true);
  });

  it("allows teacher/admin to manage clubs", () => {
    expect(canManageClubs({ id: 1, username: "t", full_name: "T", is_teacher: true, role: "teacher" })).toBe(true);
    expect(canManageClubs({ id: 2, username: "a", full_name: "A", is_teacher: false, role: "admin" })).toBe(true);
  });

  it("identifies admin role only", () => {
    expect(isAdmin({ id: 2, username: "a", full_name: "A", is_teacher: false, role: "admin" })).toBe(true);
    expect(isAdmin({ id: 1, username: "s", full_name: "S", is_teacher: false, role: "student" })).toBe(false);
  });
});
