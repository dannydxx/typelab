import "server-only";
import { NextResponse } from "next/server";

export function apiError(message: string, status = 400, code = "REQUEST_FAILED") {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export function unexpectedError(error: unknown) {
  console.error("Server request failed", {
    category: error instanceof Error ? error.name : "UnknownError",
    at: new Date().toISOString(),
  });
  return apiError("网络好像开了个小差，请稍后再试。", 500, "SERVER_ERROR");
}
