import "server-only";
import { createHmac, randomBytes } from "crypto";
import { ACCESS_CODE_CHARACTER_POOL, ACCESS_CODE_PATTERN } from "@/lib/config";
import type { AccessCodeStatus } from "@/lib/types";

export type AccessCodeRecord = {
  id: string;
  code_hash: string;
  batch_id: string;
  status: AccessCodeStatus;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  attempt_id: string | null;
};

export function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidAccessCodeFormat(value: string) {
  return ACCESS_CODE_PATTERN.test(normalizeAccessCode(value));
}

function accessCodeHashSecret() {
  const secret = process.env.ACCESS_CODE_HASH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("ACCESS_CODE_HASH_SECRET_REQUIRED");
  return secret || "development-only-access-code-hash-secret";
}

export function hashAccessCode(value: string, secret = accessCodeHashSecret()) {
  return createHmac("sha256", secret).update(normalizeAccessCode(value)).digest("hex");
}

function randomPoolCharacter(pool: string, random: (size: number) => Buffer) {
  if (pool.length < 2 || pool.length > 256) throw new Error("INVALID_ACCESS_CODE_POOL");
  const limit = 256 - (256 % pool.length);
  while (true) {
    const byte = random(1)[0];
    if (byte < limit) return pool[byte % pool.length];
  }
}

export function generateAccessCode(
  pool = ACCESS_CODE_CHARACTER_POOL,
  random: (size: number) => Buffer = randomBytes,
) {
  const characters = Array.from({ length: 8 }, () => randomPoolCharacter(pool, random));
  return `${characters.slice(0, 4).join("")}-${characters.slice(4).join("")}`;
}

export function generateUniqueAccessCodes(count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 5000) throw new Error("INVALID_ACCESS_CODE_COUNT");
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateAccessCode());
  return [...codes];
}
