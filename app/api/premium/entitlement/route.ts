import { NextRequest, NextResponse } from "next/server";
import { XHS_FIXTURE_ATTEMPT_COOKIE_NAME, XHS_FIXTURE_RESULT_COOKIE_NAME } from "@/lib/config";
import { unexpectedError } from "@/lib/server/http";
import { getPremiumAccessState } from "@/lib/server/premium-access";
import { getPremiumEntitlementIdentityFromRequest } from "@/lib/server/xhs-entitlement";

function privateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getPremiumEntitlementIdentityFromRequest(request);
    const state = await getPremiumAccessState(identity, identity?.fixture ? {
      activeAttemptId: request.cookies.get(XHS_FIXTURE_ATTEMPT_COOKIE_NAME)?.value ?? null,
      resultCookie: request.cookies.get(XHS_FIXTURE_RESULT_COOKIE_NAME)?.value ?? null,
    } : undefined);
    return privateResponse(NextResponse.json(state));
  } catch (error) {
    return privateResponse(unexpectedError(error));
  }
}
