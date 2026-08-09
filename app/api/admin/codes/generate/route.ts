import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { REDEEM_CHARACTER_POOL, PRODUCT_CONFIG } from "@/lib/config";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { generateRedeemCode } from "@/lib/server/security";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({ count: z.union([z.literal(10), z.literal(50), z.literal(100), z.literal(500), z.literal(1000)]) });

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("请选择有效的生成数量。", 400, "INVALID_COUNT");
    const supabase = createServiceClient();
    const { data: batchId, error: batchError } = await supabase.rpc("create_code_batch", { p_created_by: admin.id });
    if (batchError) throw batchError;

    const unique = new Set<string>();
    while (unique.size < parsed.data.count) unique.add(generateRedeemCode(REDEEM_CHARACTER_POOL));
    const rows = [...unique].map((code) => ({
      code,
      batch_id: batchId,
      status: "unused",
      max_completed_count: PRODUCT_CONFIG.maxCompletedTests,
    }));
    const { error } = await supabase.from("redeem_codes").insert(rows);
    if (error) throw error;
    return NextResponse.json({ ok: true, count: rows.length, batchId });
  } catch (error) {
    return unexpectedError(error);
  }
}
