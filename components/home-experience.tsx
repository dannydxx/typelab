"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/config";
import type { PremiumAccessState } from "@/lib/types";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import { clearPremiumAttemptStorage } from "@/lib/premium-client-storage";
import { getUserFacingError } from "@/lib/user-facing-error";
import { getPlatformCommerceAction } from "@/lib/platform-commerce";

export function HomeExperience() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");
  const [access, setAccess] = useState<PremiumAccessState | null>(null);
  const commerceAction = getPlatformCommerceAction();

  useEffect(() => {
    let cancelled = false;
    async function loadAccess() {
      try {
        const response = await fetch("/api/premium/entitlement", { credentials: "same-origin", cache: "no-store" });
        const state = await response.json() as PremiumAccessState;
        if (cancelled) return;
        if (response.ok && state.entitled) setAccess(state);
        else { clearPremiumAttemptStorage(); setAccess(null); }
      } catch {
        if (!cancelled) setError("暂时无法确认小红书完整版权益，请稍后再试。");
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    }
    void loadAccess();
    return () => { cancelled = true; };
  }, []);

  async function continueFromAccess() {
    if (!access?.entitled) return;
    setBusy(true); setError("");
    try {
      if (access.hasActiveAttempt && access.activeAttemptId) {
        localStorage.setItem(STORAGE_KEYS.attemptId, access.activeAttemptId);
        router.push("/premium/test");
      } else if (access.hasCompletedResult) router.push("/premium/result");
      else if (access.canStart) {
        await startPremiumAttempt();
        router.push("/premium/test");
      } else setError("当前商品权益没有可继续的测试。");
    } catch (cause) {
      setError(getUserFacingError(cause, "暂时无法继续测试，请稍后再试。"));
    } finally { setBusy(false); }
  }

  async function startAgain() {
    setBusy(true); setError("");
    try {
      await startPremiumAttempt();
      router.push("/premium/test");
    } catch (cause) {
      setError(getUserFacingError(cause, "暂时无法开始新的测试。"));
    } finally { setBusy(false); }
  }

  const primaryLabel = checkingAccess
    ? "正在确认平台权益…"
    : access?.hasActiveAttempt
      ? "继续上次测试"
      : access?.hasCompletedResult
        ? "查看完整结果"
        : "开始完整测试";

  return (
    <main className="app-shell landing page-padding">
      <nav className="landing-nav"><p className="eyebrow">16型恋爱人格测试</p><span className="landing-index">付费完整版</span></nav>
      <section className="hero">
        <p className="eyebrow">你的完整恋爱人格档案</p>
        <h1>16型<br />恋爱人格测试</h1>
        <p className="hero-line">有些人越喜欢越主动，<br />有些人越喜欢，反而越安静。</p>
        <div className="hero-facts"><span>20道场景题</span><span>16种人格</span><span>约3分钟</span></div>
        {access?.entitled ? (
          <>
            <button className="primary-button" onClick={continueFromAccess} disabled={busy || checkingAccess}>{primaryLabel}</button>
            {access.hasCompletedResult && access.canStart && !access.hasActiveAttempt && <button className="text-button premium-retest" onClick={startAgain} disabled={busy}>重新测试</button>}
          </>
        ) : (
          <div className="platform-access-state">
            <p>{checkingAccess ? "正在确认当前账号的完整版权益……" : "当前账号暂无完整版访问权限。"}</p>
            <span>完整版由小红书商品提供，平台确认权益后可在这里继续。</span>
            {commerceAction.available && <a className="secondary-button platform-commerce-link" href={commerceAction.href} target="_blank" rel="noreferrer">{commerceAction.label}</a>}
          </div>
        )}
        <p className="error-text" role="alert">{error}</p>
      </section>
      <p className="disclaimer">本测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断或专业心理建议。测试答案仅用于本次结果计算，我们不收集姓名、手机号或微信。</p>
    </main>
  );
}
