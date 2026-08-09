import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";

export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, digest: hashSessionToken(token) };
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRedeemCode(pool: string) {
  const body = Array.from({ length: 8 }, () => pool[randomInt(0, pool.length)]).join("");
  return `LOVE-${body.slice(0, 4)}-${body.slice(4)}`;
}
