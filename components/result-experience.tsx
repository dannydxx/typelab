"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DimensionScale } from "./dimension-scale";
import { PersonalityVisual } from "./personality-visual";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { PRODUCT_CONFIG, STORAGE_KEYS } from "@/lib/config";
import { createShareCard } from "@/lib/share-card";
import type { StoredResult } from "@/lib/types";
import { ResultReveal } from "./result-reveal";
import { normalizeStoredResult } from "@/lib/personality-compat";

const reportSections = [
  ["01", "BASE", "你的恋爱底色", "base"],
  ["02", "HEART", "心动之后的你", "inLove"],
  ["03", "SAFETY", "你最需要的安全感", "securityNeed"],
  ["04", "BOUNDARY", "你的恋爱雷区", "pitfalls"],
  ["05", "ATTRACTION", "你容易被哪种人吸引", "attraction"],
  ["06", "NEEDS", "关系中的隐藏需求", "hiddenNeed"],
  ["07", "ADVICE", "给你的恋爱建议", "advice"],
] as const;

export function ResultExperience() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState(4);
  const [revealing, setRevealing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const personality = useMemo(() => result ? PERSONALITY_BY_ID[result.personalityId] : null, [result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewType = process.env.NODE_ENV === "development" ? params.get("preview") : null;
    if (previewType && PERSONALITY_BY_ID[previewType]) {
      setResult({ attemptId: "00000000-0000-4000-8000-000000000000", personalityId: previewType, scores: { security: 6, closeness: 4, expression: -2, conflict: 5 }, completedAt: new Date().toISOString() });
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
    const text = `我测出来是「${personality.name}」。\n${personality.tagline}\n你会是哪一种恋爱人格？`;
    try { await navigator.clipboard.writeText(text); setActionMessage("分享文案已复制。"); }
    catch { setActionMessage("复制失败，请长按文字手动复制。 "); }
  }

  if (!result || !personality) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的人格档案……</p></main>;
  if (revealing) return <ResultReveal step={analysisStep} />;

  const report = personality.report;
  return (
    <main className="app-shell result-page" style={{ "--personality": personality.primaryColor } as React.CSSProperties}>
      <section className="result-hero page-padding">
        <header className="result-top"><p className="eyebrow">16型恋爱人格测试</p><span className="type-number">TYPE {personality.id}</span></header>
        <PersonalityVisual personality={personality} />
        <div className="result-identity">
          <p className="eyebrow">你的恋爱人格是</p><h1>{personality.name}</h1><p className="result-tagline">{personality.tagline}</p>
          <div className="trait-row">{personality.keywords.map((trait) => <span key={trait}>○ {trait}</span>)}</div>
        </div>
      </section>
      <section className="dimensions page-padding">
        <p className="eyebrow">四维关系坐标</p><h2 className="section-heading">你在关系里的位置</h2>
        <DimensionScale title="安全感" en="SECURITY" left="稳定" right="敏感" score={result.scores.security} />
        <DimensionScale title="亲密节奏" en="CLOSENESS" left="独立" right="靠近" score={result.scores.closeness} />
        <DimensionScale title="表达方式" en="EXPRESSION" left="克制" right="直接" score={result.scores.expression} />
        <DimensionScale title="冲突处理" en="CONFLICT" left="冷静" right="解决" score={result.scores.conflict} />
      </section>
      <section className="report page-padding">
        <p className="eyebrow">完整人格档案</p><h2 className="section-heading">一份关于你如何去爱的档案</h2>
        {reportSections.map(([number, en, title, key]) => {
          const content = report[key];
          return <article className="report-block" key={key}><span className="report-number">{number}</span><span className="report-en">{en}</span><h2>{title}</h2>{Array.isArray(content) ? <ul>{content.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{content}</p>}</article>;
        })}
        <div className="result-actions">
          <button className="primary-button" onClick={saveCard}>保存我的人格卡</button>
          <button className="secondary-button" onClick={copyShareText}>复制分享文案</button>
          <p className="error-text" role="status" style={{ textAlign: "center" }}>{actionMessage}</p>
          <p className="result-note">{PRODUCT_CONFIG.brandName} · {PRODUCT_CONFIG.xhsAccount}<br />测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断。</p>
        </div>
      </section>
    </main>
  );
}
