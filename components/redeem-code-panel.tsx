"use client";

import { useState } from "react";
import { LOCAL_DEMO_CODE } from "@/lib/config";
import type { PremiumSessionState } from "@/lib/types";
import { getUserFacingError } from "@/lib/user-facing-error";

export type RedeemSuccessState = PremiumSessionState & { ok?: boolean };

export function RedeemCodePanel({
  onRedeemed,
  className = "",
}: {
  onRedeemed: (state: RedeemSuccessState) => void | Promise<void>;
  className?: string;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess(false);
    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json() as RedeemSuccessState & { message?: string };
      if (!response.ok || !data.authenticated) throw new Error(data.message || "这个兑换码暂时无法使用，请检查后再试。");
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 420));
      await onRedeemed(data);
    } catch (cause) {
      setSuccess(false);
      setError(getUserFacingError(cause, "网络好像开了个小差，请稍后再试。"));
    } finally { setBusy(false); }
  }

  return (
    <form className={`redeem-panel ${className}`} onSubmit={submit}>
      <label htmlFor="redeem-code">请输入你购买后获得的专属兑换码</label>
      {process.env.NODE_ENV === "development" && <p className="demo-code-note">本地验收码：<button type="button" onClick={() => setCode(LOCAL_DEMO_CODE)}>{LOCAL_DEMO_CODE}</button></p>}
      <input
        id="redeem-code"
        className="code-input"
        value={code}
        onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(""); }}
        placeholder="请输入兑换码"
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={14}
        required
      />
      <button className="primary-button" type="submit" disabled={busy || success}>
        {success ? "兑换成功 · 正在开启测试…" : busy ? "正在验证…" : "验证并继续测试"}
      </button>
      <p className="error-text" role="alert">{error}</p>
    </form>
  );
}
