import { NextRequest, NextResponse } from "next/server";
import { XHS_FIXTURE_RESULT_COOKIE_NAME } from "@/lib/config";
import { apiError, unexpectedError } from "@/lib/server/http";
import {
  decodeFixturePremiumResult,
  getPremiumResultForEntitlement,
} from "@/lib/server/premium-access";
import { readPremiumPersonalityPortrait } from "@/lib/server/personality-portrait";
import { getPremiumEntitlementIdentityFromRequest } from "@/lib/server/xhs-entitlement";

function privateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    if (!/^(0[1-9]|1[0-6])$/.test(type)) {
      return privateResponse(apiError("没有找到这份人格形象。", 404, "PORTRAIT_NOT_FOUND"));
    }

    const identity = await getPremiumEntitlementIdentityFromRequest(request);
    if (!identity?.entitlement.entitled) {
      return privateResponse(apiError("当前账号暂无完整版访问权限。", 403, "ENTITLEMENT_REQUIRED"));
    }

    const result = identity.fixture
      ? decodeFixturePremiumResult(request.cookies.get(XHS_FIXTURE_RESULT_COOKIE_NAME)?.value)
      : await getPremiumResultForEntitlement(identity);
    if (!result || result.personalityId !== type) {
      return privateResponse(apiError("这份完整人格形象不属于当前正式结果。", 403, "PORTRAIT_FORBIDDEN"));
    }

    const portrait = await readPremiumPersonalityPortrait(type);
    if (!portrait) {
      return privateResponse(apiError("完整人格形象尚未配置。", 404, "PORTRAIT_NOT_CONFIGURED"));
    }

    return privateResponse(new NextResponse(new Uint8Array(portrait), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `inline; filename="type${type}.webp"`,
      },
    }));
  } catch (error) {
    return privateResponse(unexpectedError(error));
  }
}
