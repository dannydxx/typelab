"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/config";
import type { PremiumAccessState } from "@/lib/types";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import { clearPremiumAttemptStorage } from "@/lib/premium-client-storage";
import { getUserFacingError } from "@/lib/user-facing-error";
import { AccessCodePanel } from "./access-code-panel";

export function HomeExperience() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");
  const [access, setAccess] = useState<PremiumAccessState | null>(null);

  const loadAccess = useCallback(async () => {
    const response = await fetch("/api/access/session", { credentials: "same-origin", cache: "no-store" });
    const state = await response.json() as PremiumAccessState;
    if (!response.ok) throw new Error("暂时无法确认完整版访问状态。");
    if (state.authorized) setAccess(state);
    else { clearPremiumAttemptStorage(); setAccess(null); }
    setCheckingAccess(false);
    return state;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAccess().catch(() => {
      if (!cancelled) { setError("暂时无法确认完整版访问状态，请稍后再试。"); setCheckingAccess(false); }
    });
    return () => { cancelled = true; };
  }, [loadAccess]);

  async function continueWithState(state = access) {
    if (!state?.authorized) return;
    setBusy(true); setError("");
    try {
      if (state.hasActiveAttempt && state.activeAttemptId) {
        localStorage.setItem(STORAGE_KEYS.attemptId, state.activeAttemptId);
        router.push("/premium/test");
      } else if (state.hasCompletedResult) {
        router.push("/premium/result");
      } else if (state.canStart) {
        await startPremiumAttempt();
        router.push("/premium/test");
      } else setError("这个访问码当前没有可继续的测试。");
    } catch (cause) {
      setError(getUserFacingError(cause, "暂时无法继续测试，请稍后再试。"));
    } finally { setBusy(false); }
  }

  async function onActivated() {
    const state = await loadAccess();
    await continueWithState(state);
  }

  const primaryLabel = checkingAccess
    ? "正在确认访问状态……"
    : access?.hasActiveAttempt
      ? "继续上次测试"
      : access?.hasCompletedResult
        ? "查看完整结果"
        : "开始完整测试";

  return (
    <main className="app-shell landing page-padding">
      <nav className="landing-nav"><p className="eyebrow">16型恋爱人格测试</p><span className="landing-index">完整版</span></nav>
      <section className="hero premium-entry-hero">
        <p className="eyebrow">恋爱动物人格 · 完整版</p>
        <h1>确认你的<br />正式恋爱人格</h1>
        <p className="hero-line">完成20个关系场景，<br />展开你的完整恋爱人格档案。</p>
        <div className="hero-facts"><span>正式人格</span><span>关系坐标</span><span>完整人格形象</span></div>
        <ul className="premium-content-list">
          {["恋爱底色", "心动机制", "安全感机制", "恋爱雷区", "隐藏需求", "人格恋爱系统", "关系建议", "完整人格形象"].map((item) => <li key={item}>○ {item}</li>)}
        </ul>
        {access?.authorized ? (
          <button className="primary-button" onClick={() => continueWithState()} disabled={busy || checkingAccess}>{primaryLabel}</button>
        ) : checkingAccess ? (
          <p className="premium-access-checking">正在确认访问状态……</p>
        ) : (
          <AccessCodePanel onSuccess={onActivated} />
        )}
        <p className="error-text" role="alert">{error}</p>
      </section>
      <p className="disclaimer">访问码由小红书订单自动发货提供。本网站不展示价格、不创建订单，也不处理付款。</p>
    </main>
  );
}
