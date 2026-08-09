"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { STORAGE_KEYS } from "@/lib/config";
import { createShareCard } from "@/lib/share-card";
import type { DimensionScores, Personality, StoredResult } from "@/lib/types";
import { ResultReveal } from "./result-reveal";
import { normalizeStoredResult } from "@/lib/personality-compat";
import { ResultDetailPage } from "./result-detail/result-detail-page";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import { getUserFacingError } from "@/lib/user-facing-error";

function previewScoresFor(personality: Personality): DimensionScores {
  return {
    security: personality.poles[0] === "sensitive" ? 6 : -6,
    closeness: personality.poles[1] === "close" ? 6 : -6,
    expression: personality.poles[2] === "direct" ? 6 : -6,
    conflict: personality.poles[3] === "resolve" ? 6 : -6,
  };
}

export function ResultExperience() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState(4);
  const [revealing, setRevealing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [retestBusy, setRetestBusy] = useState(false);
  const personality = useMemo(() => result ? PERSONALITY_BY_ID[result.personalityId] : null, [result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewType = process.env.NODE_ENV === "development" ? params.get("preview") : null;
    if (previewType && PERSONALITY_BY_ID[previewType]) {
      const previewPersonality = PERSONALITY_BY_ID[previewType];
      setResult({ attemptId: "00000000-0000-4000-8000-000000000000", personalityId: previewType, scores: previewScoresFor(previewPersonality), completedAt: new Date().toISOString() });
      if (params.get("reveal") === "1") {
        setRevealing(true); setAnalysisStep(0);
        const timers = [320, 650, 980, 1280].map((delay, index) => window.setTimeout(() => setAnalysisStep(index + 1), delay));
        timers.push(window.setTimeout(() => setRevealing(false), 1850));
        return () => timers.forEach(window.clearTimeout);
      }
      return;
    }
    if (!localStorage.getItem(STORAGE_KEYS.session)) { router.replace("/premium"); return; }
    const raw = localStorage.getItem(STORAGE_KEYS.lastResult);
    if (!raw) { router.replace("/premium"); return; }
    const normalized = normalizeStoredResult(raw);
    if (!normalized) { router.replace("/premium"); return; }
    localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(normalized));
    setResult(normalized);
    const shouldReveal = params.get("reveal") === "1";
    if (shouldReveal) {
      setRevealing(true); setAnalysisStep(0);
      const timers = [320, 650, 980, 1280].map((delay, index) => window.setTimeout(() => setAnalysisStep(index + 1), delay));
      timers.push(window.setTimeout(() => setRevealing(false), 1850));
      return () => timers.forEach(window.clearTimeout);
    }
  }, [router]);

  async function saveCard() {
    if (!personality || !result) return;
    setActionMessage("正在生成人格艺术卡…");
    try {
      const blob = await createShareCard(personality, result);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `恋爱人格-${personality.name}.png`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setActionMessage("人格卡已生成。如未自动保存，请长按图片或在下载中查看。");
    } catch { setActionMessage("人格卡生成失败，请稍后再试或直接截图保存。 "); }
  }

  async function copyShareText() {
    if (!personality) return;
    const text = personality.v2?.share.shortCopy ?? `我测出来是「${personality.name}」。\n${personality.tagline}\n你会是哪一种恋爱人格？`;
    try { await navigator.clipboard.writeText(text); setActionMessage("分享文案已复制。"); }
    catch { setActionMessage("复制失败，请长按文字手动复制。 "); }
  }

  async function retest() {
    const params = new URLSearchParams(window.location.search);
    if (process.env.NODE_ENV === "development" && params.get("preview")) {
      router.push("/premium");
      return;
    }

    const sessionToken = localStorage.getItem(STORAGE_KEYS.session);
    if (!sessionToken) {
      setActionMessage("兑换会话已失效，请返回完整版首页重新验证兑换码。");
      return;
    }

    setRetestBusy(true);
    setActionMessage("正在准备新的测试……");
    try {
      await startPremiumAttempt(sessionToken);
      router.push("/premium/test");
    } catch (cause) {
      setActionMessage(getUserFacingError(cause, "暂时无法开始测试，请稍后再试。"));
    } finally {
      setRetestBusy(false);
    }
  }

  if (!result || !personality) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的人格档案……</p></main>;
  if (revealing) return <ResultReveal step={analysisStep} />;

  return <ResultDetailPage personality={personality} result={result} actionMessage={actionMessage} retestBusy={retestBusy} onSave={saveCard} onCopy={copyShareText} onRetest={retest} onHome={() => router.push("/premium")} />;
}
