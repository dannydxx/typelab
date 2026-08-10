import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const supabase = createServiceClient();
    const { error: refreshError } = await supabase.rpc("refresh_expired_access_codes");
    if (refreshError) throw refreshError;
    const [resultQuery, batchQuery, codeQuery] = await Promise.all([
      supabase.from("test_results").select("personality_type").not("access_code_id", "is", null),
      supabase.from("access_code_batches").select("id, label, created_at, code_count, validity_hours").order("created_at", { ascending: false }).limit(30),
      supabase.from("access_codes").select("batch_id, status"),
    ]);
    if (resultQuery.error) throw resultQuery.error;
    if (batchQuery.error) throw batchQuery.error;
    if (codeQuery.error) throw codeQuery.error;
    const resultRows = resultQuery.data ?? [];
    const personalities = Array.from({ length: 16 }, (_, index) => {
      const id = String(index + 1).padStart(2, "0");
      return { id, count: resultRows.filter((row) => row.personality_type === id).length };
    });
    const statusCounts = (batchId: string, status: string) => (codeQuery.data ?? []).filter((row) => row.batch_id === batchId && row.status === status).length;
    const batches = (batchQuery.data ?? []).map((batch) => ({
      id: batch.id,
      label: batch.label,
      createdAt: batch.created_at,
      codeCount: batch.code_count,
      validityHours: batch.validity_hours,
      unusedCount: statusCounts(batch.id, "UNUSED"),
      activeCount: statusCounts(batch.id, "ACTIVE"),
      expiredCount: statusCounts(batch.id, "EXPIRED"),
      revokedCount: statusCounts(batch.id, "REVOKED"),
    }));
    const inventory = {
      total: (codeQuery.data ?? []).length,
      unused: (codeQuery.data ?? []).filter((row) => row.status === "UNUSED").length,
      active: (codeQuery.data ?? []).filter((row) => row.status === "ACTIVE").length,
      expired: (codeQuery.data ?? []).filter((row) => row.status === "EXPIRED").length,
      revoked: (codeQuery.data ?? []).filter((row) => row.status === "REVOKED").length,
    };
    return NextResponse.json({ ok: true, totalCompleted: resultRows.length, personalities, inventory, batches });
  } catch (error) {
    return unexpectedError(error);
  }
}
