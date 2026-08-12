"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { createPremiumShareCard } from "@/lib/premium-share-card";
import type { StoredResult } from "@/lib/types";
import { ResultReveal } from "./result-reveal";
import { ResultDetailPage } from "./result-detail/result-detail-page";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import { getUserFacingError } from "@/lib/user-facing-error";
import { DevPreviewBanner } from "./dev-preview-banner";

export function ResultExperience({ result, devPreview = false }: { result: StoredResult; devPreview?: boolean }) {
  const router = useRouter();
  const [analysisStep, setAnalysisStep] = useState(4);
  const [revealing, setRevealing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [retestBusy, setRetestBusy] = useState(false);
  const personality = useMemo(() => PERSONALITY_BY_ID[result.personalityId] ?? null, [result.personalityId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldReveal = params.get("reveal") === "1";
    if (shouldReveal) {
      setRevealing(true); setAnalysisStep(0);
      const timers = [320, 650, 980, 1280].map((delay, index) => window.setTimeout(() => setAnalysisStep(index + 1), delay));
      timers.push(window.setTimeout(() => setRevealing(false), 1850));
      return () => timers.forEach(window.clearTimeout);
    }
  }, []);

  async function saveCard() {
    if (!personality || !result) return;
    setActionMessage("正在生成人格艺术卡…");
    try {
      const blob = await createPremiumShareCard(personality, result);
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
    if (devPreview) {
      router.push("/dev/premium-preview/test");
      return;
    }

    setRetestBusy(true);
    setActionMessage("正在准备新的测试……");
    try {
      await startPremiumAttempt();
      router.push("/premium/test");
    } catch (cause) {
      setActionMessage(getUserFacingError(cause, "暂时无法开始测试，请稍后再试。"));
    } finally {
      setRetestBusy(false);
    }
  }

  if (!personality) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的人格档案……</p></main>;
  if (revealing) return <>{devPreview && <DevPreviewBanner />}<ResultReveal step={analysisStep} /></>;

  return <>{devPreview && <DevPreviewBanner />}<ResultDetailPage personality={personality} result={result} actionMessage={actionMessage} retestBusy={retestBusy} onSave={saveCard} onCopy={copyShareText} onRetest={retest} onHome={() => router.push(devPreview ? "/dev/premium-preview" : "/premium")} /></>;
}
