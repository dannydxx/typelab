"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/config";
import type { PremiumSessionState } from "@/lib/types";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import {
  clearLegacyPremiumAuthorizationStorage,
  clearPremiumAttemptStorage,
  clearPremiumClientStorage,
} from "@/lib/premium-client-storage";
import { getUserFacingError } from "@/lib/user-facing-error";
import { RedeemCodePanel, type RedeemSuccessState } from "@/components/redeem-code-panel";

export function HomeExperience() {
  const router = useRouter();
  const [showRedeem, setShowRedeem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [sessionState, setSessionState] = useState<PremiumSessionState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch("/api/redeem/session", { credentials: "same-origin", cache: "no-store" });
        const state = await response.json() as PremiumSessionState;
        if (cancelled) return;
        if (response.ok && state.authenticated) {
          clearLegacyPremiumAuthorizationStorage();
          setSessionState(state);
          setShowRedeem(false);
        } else {
          clearPremiumClientStorage();
          setSessionState(null);
        }
      } catch {
        if (!cancelled) setError("暂时无法确认兑换状态，请稍后再试。");
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void loadSession();
    return () => { cancelled = true; };
  }, []);

  async function startAttempt() {
    await startPremiumAttempt();
    router.push("/premium/test");
  }

  async function continueFromServerState() {
    if (!sessionState) return setShowRedeem(true);
    setBusy(true); setError("");
    try {
      if (sessionState.hasActiveAttempt && sessionState.activeAttemptId) {
        localStorage.setItem(STORAGE_KEYS.attemptId, sessionState.activeAttemptId);
        router.push("/premium/test");
      } else if (sessionState.hasCompletedResult) {
        router.push("/premium/result");
      } else if (sessionState.canStart) {
        await startAttempt();
      } else {
        setError("该兑换码当前没有可继续的测试。");
      }
    } catch (cause) {
      setError(getUserFacingError(cause, "暂时无法继续测试，请稍后再试。"));
    } finally { setBusy(false); }
  }

  async function resetRedemption() {
    setBusy(true);
    try {
      await fetch("/api/redeem/session", { method: "DELETE", credentials: "same-origin" });
    } finally {
      clearPremiumClientStorage();
      setSessionState(null);
      setError(""); setShowRedeem(true); setBusy(false);
    }
  }

  async function handleRedeemed(data: RedeemSuccessState) {
    clearLegacyPremiumAuthorizationStorage();
    const storedAttemptId = localStorage.getItem(STORAGE_KEYS.attemptId);
    if (!data.activeAttemptId || data.activeAttemptId !== storedAttemptId) clearPremiumAttemptStorage();
    setSessionState(data);

    if (data.hasActiveAttempt && data.activeAttemptId) {
      localStorage.setItem(STORAGE_KEYS.attemptId, data.activeAttemptId);
      router.push("/premium/test");
    } else if (data.hasCompletedResult) {
      router.push("/premium/result");
    } else if (data.canStart) {
      await startAttempt();
    } else {
      throw new Error("该兑换码当前没有可开始的测试。");
    }
  }

  const primaryLabel = checkingSession
    ? "正在确认兑换状态…"
    : sessionState?.hasActiveAttempt
      ? "继续上次测试"
      : sessionState?.hasCompletedResult
        ? "查看完整结果"
        : "开始测试";

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
            <button className="primary-button" onClick={sessionState ? continueFromServerState : () => setShowRedeem(true)} disabled={busy || checkingSession}>
              {primaryLabel}
            </button>
            {sessionState?.hasCompletedResult && sessionState.canStart && !sessionState.hasActiveAttempt && (
              <button className="text-button" style={{ width: "100%" }} onClick={startAttempt} disabled={busy}>重新测试</button>
            )}
            {sessionState && <button className="text-button" style={{ width: "100%" }} onClick={resetRedemption} disabled={busy}>使用新的兑换码</button>}
            <p className="error-text" role="alert">{error}</p>
          </>
        )}
        {showRedeem && <RedeemCodePanel onRedeemed={handleRedeemed} />}
      </section>
      <p className="disclaimer">本测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断或专业心理建议。测试答案仅用于本次结果计算，我们不收集姓名、手机号或微信。</p>
    </main>
  );
}
