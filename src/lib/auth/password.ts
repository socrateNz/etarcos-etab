import { randomInt } from "crypto";

const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function randomChar(charset: string): string {
  return charset[randomInt(charset.length)];
}

/**
 * Generates a cryptographically random temporary password (via Node's
 * crypto.randomInt, not Math.random) that satisfies typical complexity
 * requirements (upper/lower/digit/symbol). Used whenever an admin creates an
 * account or resets a password on someone's behalf — the affected user is
 * always forced to change it on next login (`requires_password_change`).
 */
export function generateTemporaryPassword(length = 12): string {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SYMBOLS)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => randomChar(ALL));
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
