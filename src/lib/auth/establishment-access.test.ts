import { describe, expect, it } from "vitest";
import { classifyEstablishmentAccess, isUsableId } from "./establishment-access";

describe("isUsableId", () => {
  it("rejects reserved sentinel values", () => {
    expect(isUsableId("global")).toBe(false);
    expect(isUsableId("compare")).toBe(false);
    expect(isUsableId("undefined")).toBe(false);
  });

  it("rejects empty/missing ids", () => {
    expect(isUsableId(undefined)).toBe(false);
    expect(isUsableId(null)).toBe(false);
    expect(isUsableId("")).toBe(false);
  });

  it("accepts a real id", () => {
    expect(isUsableId("11111111-1111-1111-1111-111111111111")).toBe(true);
  });
});

describe("classifyEstablishmentAccess", () => {
  it("denies access when there is no role (unauthenticated)", () => {
    expect(classifyEstablishmentAccess(undefined, "est-1", "est-2", undefined)).toEqual({
      kind: "denied",
    });
  });

  it("locks a non-owner/non-super_admin role to their own session establishment", () => {
    expect(classifyEstablishmentAccess("teacher", "est-1", "est-2", "est-3")).toEqual({
      kind: "locked",
      id: "est-1",
    });
  });

  it("never lets a locked role escalate via an explicit id when their session establishment is missing (regression: this used to leak cross-tenant access)", () => {
    expect(classifyEstablishmentAccess("parent", null, "someone-elses-establishment", undefined)).toEqual(
      { kind: "locked", id: null }
    );
  });

  it("ignores an explicit id entirely for locked roles even when it's provided", () => {
    const result = classifyEstablishmentAccess("student", "est-1", "attacker-controlled-id", "cookie-id");
    expect(result).toEqual({ kind: "locked", id: "est-1" });
  });

  it("resolves super_admin immediately using an explicit id, no ownership check needed", () => {
    expect(classifyEstablishmentAccess("super_admin", "est-1", "est-9", undefined)).toEqual({
      kind: "resolved",
      id: "est-9",
    });
  });

  it("falls back to the active-establishment cookie for super_admin when no explicit id is given", () => {
    expect(classifyEstablishmentAccess("super_admin", "est-1", undefined, "est-cookie")).toEqual({
      kind: "resolved",
      id: "est-cookie",
    });
  });

  it("falls back to the session establishment for super_admin when neither explicit id nor cookie is usable", () => {
    expect(classifyEstablishmentAccess("super_admin", "est-1", "global", "compare")).toEqual({
      kind: "resolved",
      id: "est-1",
    });
  });

  it("requires an ownership check for owner role instead of trusting the explicit id directly", () => {
    expect(classifyEstablishmentAccess("owner", "est-1", "est-9", undefined)).toEqual({
      kind: "needs_ownership_check",
      id: "est-9",
    });
  });

  it("ignores reserved sentinel ids and falls through to the session establishment for owner", () => {
    expect(classifyEstablishmentAccess("owner", "est-1", "global", "compare")).toEqual({
      kind: "needs_ownership_check",
      id: "est-1",
    });
  });

  it("returns a null-id locked decision when nothing at all is available", () => {
    expect(classifyEstablishmentAccess("owner", null, undefined, undefined)).toEqual({
      kind: "locked",
      id: null,
    });
  });
});
