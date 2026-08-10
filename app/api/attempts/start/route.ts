import { NextRequest, NextResponse } from "next/server";
import { getAccessSessionFromRequest } from "@/lib/server/access-session";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

type StartAttemptRow = { attempt_id: string; attempt_status: string };

export async function POST(request: NextRequest) {
  try {
    const identity = await getAccessSessionFromRequest(request);
    if (!identity) return apiError("请先输入有效的完整版访问码。", 403, "ACCESS_SESSION_REQUIRED");
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("start_access_test_attempt", { p_access_code_id: identity.accessCodeId });
    if (error) {
      if (error.message.includes("ACCESS_EXPIRED")) return apiError("这个访问码已超过有效期。", 403, "ACCESS_CODE_EXPIRED");
      if (error.message.includes("ACCESS_REVOKED")) return apiError("这个访问码已被撤销。", 403, "ACCESS_CODE_REVOKED");
      if (error.message.includes("ATTEMPT_INVALID")) return apiError("这个访问码已经绑定其他正式测试，请联系工作人员核查。", 409, "ACCESS_CODE_ATTEMPT_CONFLICT");
      throw error;
    }
    const row = (Array.isArray(data) ? data[0] : data) as StartAttemptRow | null;
    if (!row) throw new Error("ATTEMPT_START_FAILED");
    return NextResponse.json({ ok: true, attemptId: row.attempt_id, completed: row.attempt_status === "completed" });
  } catch (error) {
    return unexpectedError(error);
  }
}
