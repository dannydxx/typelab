"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { createPremiumShareCard } from "@/lib/premium-share-card";
import type { StoredResult } from "@/lib/types";
import { ResultReveal } from "./result-reveal";
import { ResultDetailPage } from "./result-detail/result-detail-page";
import { DevPreviewBanner } from "./dev-preview-banner";
import { PremiumShareSavePreview } from "./premium-share-save-preview";
import {
  prefersPremiumImageFallback,
  sharePremiumCardFile,
  shouldTryPremiumFileShare,
} from "@/lib/premium-share-save";

export function ResultExperience({ result, devPreview = false }: { result: StoredResult; devPreview?: boolean }) {
  const router = useRouter();
  const [analysisStep, setAnalysisStep] = useState(4);
  const [revealing, setRevealing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [shareCardImageUrl, setShareCardImageUrl] = useState("");
  const cardBlobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef("");
  const downloadUrlRef = useRef("");
  const downloadRevokeTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
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

  useEffect(() => () => {
    if (downloadRevokeTimerRef.current !== null) window.clearTimeout(downloadRevokeTimerRef.current);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function closeShareCardPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setShareCardImageUrl("");
    setActionMessage("");
  }

  function showShareCardPreview(blob: Blob) {
    if (!previewUrlRef.current) previewUrlRef.current = URL.createObjectURL(blob);
    setShareCardImageUrl(previewUrlRef.current);
    setActionMessage("图片已生成，请在预览中长按保存。");
  }

  function downloadShareCard(blob: Blob, filename: string) {
    if (!downloadUrlRef.current) downloadUrlRef.current = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrlRef.current;
    anchor.download = filename;
    anchor.click();
    if (downloadRevokeTimerRef.current !== null) window.clearTimeout(downloadRevokeTimerRef.current);
    downloadRevokeTimerRef.current = window.setTimeout(() => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = "";
      downloadRevokeTimerRef.current = null;
    }, 5000);
  }

  async function saveCard() {
    if (!personality || !result || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setActionMessage("正在生成人格艺术卡…");
    try {
      const blob = cardBlobRef.current ?? await createPremiumShareCard(personality, result);
      cardBlobRef.current = blob;
      const userAgent = navigator.userAgent;
      const forceFallback = devPreview && new URLSearchParams(window.location.search).get("saveFallback") === "1";
      const needsFallback = forceFallback || prefersPremiumImageFallback(userAgent, "download" in HTMLAnchorElement.prototype);

      if (!forceFallback && shouldTryPremiumFileShare(userAgent)) {
        const shareOutcome = await sharePremiumCardFile(blob, personality.name, navigator);
        if (shareOutcome === "shared") {
          setActionMessage("已打开系统分享与保存面板。");
          return;
        }
        if (shareOutcome === "cancelled") {
          setActionMessage("");
          return;
        }
        if (shareOutcome === "failed") {
          showShareCardPreview(blob);
          return;
        }
      }

      if (needsFallback) {
        showShareCardPreview(blob);
        return;
      }

      downloadShareCard(blob, `恋爱人格-${personality.name}.png`);
      setActionMessage("人格卡已生成，下载已开始。");
    } catch (cause) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
      setShareCardImageUrl("");
      setActionMessage("人格卡生成失败，请稍后再试。");
    } finally {
      saveInFlightRef.current = false;
    }
  }

  async function copyShareText() {
    if (!personality) return;
    const text = personality.v2?.share.shortCopy ?? `我测出来是「${personality.name}」。\n${personality.tagline}\n你会是哪一种恋爱人格？`;
    try { await navigator.clipboard.writeText(text); setActionMessage("分享文案已复制。"); }
    catch { setActionMessage("复制失败，请长按文字手动复制。 "); }
  }

  if (!personality) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的人格档案……</p></main>;
  if (revealing) return <>{devPreview && <DevPreviewBanner />}<ResultReveal step={analysisStep} /></>;

  return <>{devPreview && <DevPreviewBanner />}<ResultDetailPage personality={personality} result={result} actionMessage={actionMessage} onSave={saveCard} onCopy={copyShareText} onHome={() => router.push(devPreview ? "/dev/premium-preview" : "/premium")} /><PremiumShareSavePreview imageUrl={shareCardImageUrl} personalityName={personality.name} onClose={closeShareCardPreview} onLoad={() => setActionMessage("图片已生成，请长按保存到相册。")} onError={() => { closeShareCardPreview(); setActionMessage("人格卡图片显示失败，请稍后再试。"); }} /></>;
}
