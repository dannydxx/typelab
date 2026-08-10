import { NextRequest, NextResponse } from "next/server";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { selectFreePersonalityPreview } from "@/lib/server/free-personality-preview";
import { apiError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  const personalityId = request.nextUrl.searchParams.get("type");
  if (!personalityId || !/^(0[1-9]|1[0-6])$/.test(personalityId)) {
    return apiError("没有找到这份免费人格结果。", 404, "FREE_PERSONALITY_NOT_FOUND");
  }
  const personality = PERSONALITY_BY_ID[personalityId];
  const preview = personality ? selectFreePersonalityPreview(personality) : null;
  if (!preview) return apiError("没有找到这份免费人格结果。", 404, "FREE_PERSONALITY_NOT_FOUND");
  return NextResponse.json(preview, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
