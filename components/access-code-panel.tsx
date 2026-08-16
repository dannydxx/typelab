"use client";

import { useState } from "react";
import { getUserFacingError } from "@/lib/user-facing-error";

export function AccessCodePanel({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function activate(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/access/activate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "访问码验证失败，请稍后再试。");
      setAccessCode("");
      await onSuccess();
    } catch (cause) {
      setError(getUserFacingError(cause, "访问码验证失败，请稍后再试。"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="access-code-panel" onSubmit={activate}>
      <label htmlFor="premium-access-code">请输入完整版体验码</label>
      <input
        id="premium-access-code"
        value={accessCode}
        onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
        placeholder="XXXX-XXXX"
        autoComplete="one-time-code"
        inputMode="text"
        maxLength={9}
        spellCheck={false}
        required
      />
      <button className="primary-button" disabled={busy}>{busy ? "正在验证……" : "开始完整版测试"}</button>
      <p className="error-text" role="alert">{error}</p>
    </form>
  );
}
