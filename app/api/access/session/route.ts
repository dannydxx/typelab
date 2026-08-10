import { NextRequest, NextResponse } from "next/server";
import { getAccessSessionFromRequest } from "@/lib/server/access-session";
import { getPremiumAccessState, unavailablePremiumAccessState } from "@/lib/server/premium-access";
import { unexpectedError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const identity = await getAccessSessionFromRequest(request);
    const state = identity ? await getPremiumAccessState(identity) : unavailablePremiumAccessState();
    return NextResponse.json(state, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return unexpectedError(error);
  }
}
