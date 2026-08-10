import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readPremiumPersonalityPortrait(personalityId: string) {
  if (!/^(0[1-9]|1[0-6])$/.test(personalityId)) return null;
  const filePath = path.join(process.cwd(), "assets", "personality-premium", `type${personalityId}.webp`);

  try {
    return await readFile(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
