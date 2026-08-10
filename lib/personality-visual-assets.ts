export interface PersonalityVisualAsset {
  previewPortrait: string;
  premiumPortrait: string;
}

export const PERSONALITY_VISUAL_IDS = Array.from(
  { length: 16 },
  (_, index) => String(index + 1).padStart(2, "0"),
);

export const PERSONALITY_VISUALS = Object.fromEntries(
  PERSONALITY_VISUAL_IDS.map((id) => [id, {
    previewPortrait: `/personality-preview/type${id}.webp`,
    premiumPortrait: `/api/premium/personality-portrait/${id}`,
  }]),
) as Record<string, PersonalityVisualAsset>;

export function getPersonalityVisualAsset(personalityId: string) {
  return PERSONALITY_VISUALS[personalityId] ?? null;
}
