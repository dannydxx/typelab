import "server-only";
import type { FreePersonalityPreview, Personality } from "@/lib/types";

export function selectFreePersonalityPreview(personality: Personality): FreePersonalityPreview | null {
  if (!personality.v2) return null;
  const v2 = personality.v2;
  return {
    id: personality.id,
    name: personality.name,
    animal: personality.animal,
    image: personality.image,
    primaryColor: personality.primaryColor,
    secondaryColor: personality.secondaryColor,
    darkColor: personality.darkColor,
    visualKeywords: personality.visualKeywords,
    tagline: personality.tagline,
    keywords: personality.keywords,
    summaryHeadline: v2.summary.headline,
    relationshipPosition: v2.relationshipPosition.map(({ key, label, left, right }) => ({ key, label, left, right })),
    baseHeadline: v2.base.headline,
    boundaryFirstTitle: v2.boundaries.items[0].title,
    innerOSPreview: {
      situation: v2.innerOS[0].situation,
      outer: v2.innerOS[0].outer,
    },
  };
}
