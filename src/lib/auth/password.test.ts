import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./password";

describe("generateTemporaryPassword", () => {
  it("generates a password of the requested length", () => {
    expect(generateTemporaryPassword(12)).toHaveLength(12);
    expect(generateTemporaryPassword(20)).toHaveLength(20);
  });

  it("defaults to 12 characters", () => {
    expect(generateTemporaryPassword()).toHaveLength(12);
  });

  it("always includes an uppercase, lowercase, digit and symbol", () => {
    for (let i = 0; i < 50; i++) {
      const pwd = generateTemporaryPassword();
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(pwd).toMatch(/[!@#$%&*]/);
    }
  });

  it("is not derived from Math.random (produces varied output across calls)", () => {
    const passwords = new Set(Array.from({ length: 100 }, () => generateTemporaryPassword()));
    expect(passwords.size).toBe(100);
  });
});
