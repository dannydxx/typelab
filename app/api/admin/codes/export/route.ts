import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const format = request.nextUrl.searchParams.get("format") === "product" ? "product" : "simple";
    const batchId = request.nextUrl.searchParams.get("batchId");
    const product = request.nextUrl.searchParams.get("product") || "16型恋爱人格测试";
    const supabase = createServiceClient();
    let query = supabase.from("redeem_codes").select("id, code").eq("status", "unused").order("created_at");
    if (batchId) query = query.eq("batch_id", batchId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data.length) return apiError("当前没有可导出的未使用兑换码。", 404, "NO_CODES");

    const header = format === "product" ? "code,product" : "code";
    const body = data.map(({ code }) => format === "product" ? `${csvCell(code)},${csvCell(product)}` : csvCell(code));
    const csv = `\uFEFF${[header, ...body].join("\r\n")}`;
    const { error: updateError } = await supabase.from("redeem_codes").update({ exported_at: new Date().toISOString() }).in("id", data.map(({ id }) => id));
    if (updateError) throw updateError;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="love-codes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return unexpectedError(error);
  }
}
