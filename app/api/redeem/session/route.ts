import { NextRequest, NextResponse } from "next/server";
import { DEMO_ATTEMPT_COOKIE_NAME, DEMO_RESULT_COOKIE_NAME } from "@/lib/config";
import { unexpectedError } from "@/lib/server/http";
import { getPremiumSessionState } from "@/lib/server/premium-result";
import {
  clearRedeemSessionCookies,
  getRedeemSessionFromRequest,
} from "@/lib/server/redeem-session";
import { unauthenticatedPremiumSessionState } from "@/lib/server/premium-authorization";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const identity = await getRedeemSessionFromRequest(request);
    if (!identity) {
      const response = NextResponse.json(unauthenticatedPremiumSessionState());
      clearRedeemSessionCookies(response);
      return noStore(response);
    }

    const state = await getPremiumSessionState(identity, identity.demo ? {
      activeAttemptId: request.cookies.get(DEMO_ATTEMPT_COOKIE_NAME)?.value ?? null,
      resultCookie: request.cookies.get(DEMO_RESULT_COOKIE_NAME)?.value ?? null,
    } : undefined);
    return noStore(NextResponse.json(state));
  } catch (error) {
    return noStore(unexpectedError(error));
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearRedeemSessionCookies(response);
  return noStore(response);
}
