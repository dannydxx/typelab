import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const supabase = createServiceClient();
    const { data: typeStats, error: typeError } = await supabase.from("premium_test_results").select("personality_type");
    if (typeError) throw typeError;
    const personalities = Array.from({ length: 16 }, (_, index) => ({
      id: String(index + 1).padStart(2, "0"),
      count: typeStats.filter((row) => row.personality_type === String(index + 1).padStart(2, "0")).length,
    }));
    return NextResponse.json({ ok: true, totalCompleted: typeStats.length, personalities });
  } catch (error) {
    return unexpectedError(error);
  }
}
