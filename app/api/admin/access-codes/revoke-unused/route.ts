import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({ batchId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("请选择有效的访问码批次。", 400, "INVALID_BATCH");
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("revoke_unused_access_code_batch", { p_batch_id: parsed.data.batchId });
    if (error) {
      if (error.message.includes("BATCH_NOT_FOUND")) return apiError("没有找到这个访问码批次。", 404, "BATCH_NOT_FOUND");
      throw error;
    }
    return NextResponse.json({ ok: true, revokedCount: Number(data) || 0 });
  } catch (error) {
    return unexpectedError(error);
  }
}
