import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_TEST_TTL_HOURS } from "@/lib/config";
import { generateUniqueAccessCodes, hashAccessCode } from "@/lib/server/access-code";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  count: z.number().int().min(1).max(5000),
  label: z.string().trim().min(1).max(120),
  format: z.enum(["csv", "txt"]).default("csv"),
});

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("请填写有效的批次名称、数量和导出格式。", 400, "INVALID_BATCH");

    const codes = generateUniqueAccessCodes(parsed.data.count);
    const supabase = createServiceClient();
    const { data: batchId, error: batchError } = await supabase.rpc("create_access_code_batch", {
      p_label: parsed.data.label,
      p_code_hashes: codes.map((code) => hashAccessCode(code)),
      p_validity_hours: ACCESS_TEST_TTL_HOURS,
      p_created_by: admin.id,
    });
    if (batchError) throw batchError;

    const timestamp = new Date().toISOString().slice(0, 10);
    const isCsv = parsed.data.format === "csv";
    const body = isCsv ? `\uFEFFaccess_code\r\n${codes.map(csvCell).join("\r\n")}` : codes.join("\r\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": isCsv ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="access-codes-${timestamp}.${parsed.data.format}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Access-Code-Batch": String(batchId),
      },
    });
  } catch (error) {
    return unexpectedError(error);
  }
}
