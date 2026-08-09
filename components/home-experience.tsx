"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCAL_DEMO_CODE, STORAGE_KEYS } from "@/lib/config";
import type { StoredResult } from "@/lib/types";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import { getUserFacingError } from "@/lib/user-facing-error";

type RedeemPayload = {
  ok: boolean;
  code: string;
  sessionToken: string;
  activatedAt: string;
  canStart: boolean;
  latestResult: StoredResult | null;
  message?: string;
};

export function HomeExperience() {
  const router = useRouter();
  const [showRedeem, setShowRedeem] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [redeemed, setRedeemed] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => setHasSession(Boolean(localStorage.getItem(STORAGE_KEYS.session))), []);

  async function startAttempt(sessionToken: string) {
    await startPremiumAttempt(sessionToken);
    router.push("/premium/test");
  }

  async function continueExisting() {
    const storedCode = localStorage.getItem(STORAGE_KEYS.code);
    if (!storedCode) return resetRedemption();
    setBusy(true); setError("");
    try {
      const verifyResponse = await fetch("/api/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: storedCode }) });
      const verified = await verifyResponse.json() as RedeemPayload;
      if (!verifyResponse.ok) throw new Error(verified.message || "兑换会话已失效，请重新输入兑换码。");
      localStorage.setItem(STORAGE_KEYS.session, verified.sessionToken);
      localStorage.setItem(STORAGE_KEYS.activatedAt, verified.activatedAt);
      if (verified.latestResult) localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(verified.latestResult));
      if (!verified.canStart && verified.latestResult) { router.push("/premium/result"); return; }
      const progress = localStorage.getItem(STORAGE_KEYS.progress);
      const attemptId = localStorage.getItem(STORAGE_KEYS.attemptId);
      if (progress && attemptId) router.push("/premium/test");
      else await startAttempt(verified.sessionToken);
    } catch (cause) {
      setHasSession(false);
      setShowRedeem(true);
      setCode(storedCode);
      setError(getUserFacingError(cause, "兑换会话已失效，请重新输入兑换码。"));
    } finally { setBusy(false); }
  }

  function resetRedemption() {
    [STORAGE_KEYS.code, STORAGE_KEYS.session, STORAGE_KEYS.activatedAt, STORAGE_KEYS.attemptId, STORAGE_KEYS.progress].forEach((key) => localStorage.removeItem(key));
    setHasSession(false); setCode(""); setError(""); setShowRedeem(true);
  }

  async function redeem(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json() as RedeemPayload;
      if (!response.ok) throw new Error(data.message || "网络好像开了个小差，请稍后再试。");
      localStorage.setItem(STORAGE_KEYS.code, data.code);
      localStorage.setItem(STORAGE_KEYS.session, data.sessionToken);
      localStorage.setItem(STORAGE_KEYS.activatedAt, data.activatedAt);
      if (data.latestResult) localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(data.latestResult));
      setRedeemed(true);
      await new Promise((resolve) => setTimeout(resolve, 850));
      if (!data.canStart && data.latestResult) router.push("/premium/result");
      else await startAttempt(data.sessionToken);
    } catch (cause) {
      setRedeemed(false);
      setError(getUserFacingError(cause, "网络好像开了个小差，请稍后再试。"));
    } finally { setBusy(false); }
  }

  return (
    <main className="app-shell landing page-padding">
      <nav className="landing-nav"><p className="eyebrow">16型恋爱人格测试</p><span className="landing-index">付费完整版</span></nav>
      <section className="hero">
        <p className="eyebrow">你的完整恋爱人格档案</p>
        <h1>16型<br />恋爱人格测试</h1>
        <p className="hero-line">有些人越喜欢越主动，<br />有些人越喜欢，反而越安静。</p>
        <div className="hero-facts"><span>20道场景题</span><span>16种人格</span><span>约3分钟</span></div>
        {!showRedeem && (
          <>
            <button className="primary-button" onClick={hasSession ? continueExisting : () => setShowRedeem(true)} disabled={busy}>
              {hasSession ? "继续上次测试" : "开始测试"}
            </button>
            {hasSession && <button className="text-button" style={{ width: "100%" }} onClick={resetRedemption}>使用新的兑换码</button>}
          </>
        )}
        {showRedeem && (
          <form className="redeem-panel" onSubmit={redeem}>
            <label htmlFor="redeem-code">请输入你购买后获得的专属兑换码</label>
            {process.env.NODE_ENV === "development" && <p className="demo-code-note">本地验收码：<button type="button" onClick={() => setCode(LOCAL_DEMO_CODE)}>{LOCAL_DEMO_CODE}</button></p>}
            <input id="redeem-code" className="code-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="请输入兑换码" autoCapitalize="characters" autoComplete="off" maxLength={14} required />
            <button className="primary-button" type="submit" disabled={busy || redeemed}>{redeemed ? "兑换成功 · 正在开启测试…" : busy ? "正在验证…" : "验证并开始测试"}</button>
            <p className="error-text" role="alert">{error}</p>
          </form>
        )}
      </section>
      <p className="disclaimer">本测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断或专业心理建议。测试答案仅用于本次结果计算，我们不收集姓名、手机号或微信。</p>
    </main>
  );
}
