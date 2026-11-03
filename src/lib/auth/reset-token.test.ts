import { describe, expect, it } from "vitest";
import { createResetToken, verifyResetToken, nonceMatches, RESET_TOKEN_TTL_MS } from "./reset-token";

const SECRET = "test-secret";
const USER = "8b1c2d3e-0000-4000-8000-000000000001";

describe("reset token", () => {
  it("accepte un jeton valide et restitue son contenu", () => {
    const now = 1_000_000;
    const token = createResetToken({ userId: USER, nonce: "abc" }, SECRET, now);
    expect(verifyResetToken(token, SECRET, now + 1000)).toEqual({
      userId: USER,
      nonce: "abc",
      exp: now + RESET_TOKEN_TTL_MS,
    });
  });

  it("refuse un jeton expiré", () => {
    const token = createResetToken({ userId: USER, nonce: "abc" }, SECRET, 0, 1000);
    expect(verifyResetToken(token, SECRET, 1000)).toBeNull();
  });

  it("refuse un mauvais secret ou une signature altérée", () => {
    const token = createResetToken({ userId: USER, nonce: "abc" }, SECRET);
    expect(verifyResetToken(token, "autre")).toBeNull();
    expect(verifyResetToken(token.slice(0, -2) + "xx", SECRET)).toBeNull();
  });

  it("refuse un contenu modifié (autre utilisateur)", () => {
    const token = createResetToken({ userId: USER, nonce: "abc" }, SECRET);
    const [, sig] = token.split(".");
    const forged = Buffer.from(`autre-user.abc.${Date.now() + 60_000}`).toString("base64url");
    expect(verifyResetToken(`${forged}.${sig}`, SECRET)).toBeNull();
  });

  it("refuse les entrées mal formées", () => {
    expect(verifyResetToken("", SECRET)).toBeNull();
    expect(verifyResetToken("a.b.c", SECRET)).toBeNull();
    expect(verifyResetToken("x".repeat(600), SECRET)).toBeNull();
  });

  it("compare les nonces", () => {
    expect(nonceMatches("abc", "abc")).toBe(true);
    expect(nonceMatches("abc", "abd")).toBe(false);
    expect(nonceMatches(undefined, "abc")).toBe(false);
    expect(nonceMatches("", "")).toBe(false);
  });
});
