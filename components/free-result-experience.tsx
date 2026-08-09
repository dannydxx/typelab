"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalityVisual } from "./personality-visual";
import { ResultReveal } from "./result-reveal";
import { FREE_STORAGE_KEYS } from "@/lib/config";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import type { StoredResult } from "@/lib/types";

export function FreeResultExperience() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [step, setStep] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const personality = useMemo(() => result ? PERSONALITY_BY_ID[result.personalityId] : null, [result]);

  useEffect(() => {
    const raw = localStorage.getItem(FREE_STORAGE_KEYS.lastResult);
    if (!raw) { router.replace("/free"); return; }
    try { setResult(JSON.parse(raw)); } catch { router.replace("/free"); return; }
    if (new URLSearchParams(window.location.search).get("reveal") === "1") {
      setRevealing(true);
      const timers = [240, 480, 720, 960].map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
      timers.push(window.setTimeout(() => setRevealing(false), 1450));
      return () => timers.forEach(window.clearTimeout);
    }
  }, [router]);

  if (!result || !personality) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的初步人格……</p></main>;
  if (revealing) return <ResultReveal step={step} title="正在捕捉你的恋爱倾向……" finalText="你的初步人格出现了。" />;

  return (
    <main className="app-shell free-result-page page-padding" style={{ "--personality": personality.primaryColor } as React.CSSProperties}>
      <header className="result-top"><p className="eyebrow">免费人格速写</p><span className="type-number">TYPE {personality.id}</span></header>
      <section className="free-result-intro">
        <PersonalityVisual personality={personality} className="free-result-visual" />
        <p className="eyebrow">你的初步恋爱人格倾向</p>
        <h1>{personality.name}</h1>
        <p className="free-result-tagline">{personality.tagline}</p>
        <div className="trait-row">{personality.traits.map((trait) => <span key={trait}>○ {trait}</span>)}</div>
        <p className="free-result-note">这是基于8道精选题得到的初步倾向。完整测试会用20个恋爱场景重新校准四个维度，结果可能发生变化。</p>
      </section>
      <section className="free-unlock-panel">
        <p className="eyebrow">PREMIUM · 完整档案</p>
        <h2>你在爱里真正需要的，<br />不止一个名字。</h2>
        <p>解锁完整恋爱人格档案，查看四维坐标、关系底色、隐藏需求、恋爱雷区与专属建议。</p>
        <Link className="primary-button free-cta" href="/free/unlock">解锁完整恋爱人格档案</Link>
        <Link className="text-button free-retry" href="/free">重新体验免费版</Link>
      </section>
    </main>
  );
}
