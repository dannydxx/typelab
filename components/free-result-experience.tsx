"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalityVisual } from "./personality-visual";
import { ResultReveal } from "./result-reveal";
import { PreliminaryRelationshipPreview } from "./preliminary-relationship-preview";
import { LockedReportPreview } from "./locked-report-preview";
import { RedeemCodePanel, type RedeemSuccessState } from "./redeem-code-panel";
import { FREE_STORAGE_KEYS, PRODUCT_CONFIG, STORAGE_KEYS } from "@/lib/config";
import type { FreePersonalityPreview, StoredResult } from "@/lib/types";
import { parseFreeStoredResult } from "@/lib/free-stored-result";
import { startPremiumAttempt } from "@/lib/start-premium-attempt";
import {
  clearLegacyPremiumAuthorizationStorage,
  clearPremiumAttemptStorage,
} from "@/lib/premium-client-storage";
import { getConfiguredPurchaseUrl } from "@/lib/purchase-config";
import { getFreeRedeemAction } from "@/lib/free-result-conversion";

const reportDirectory = [
  ["01", "人格摘要"],
  ["02", "关系坐标"],
  ["03", "恋爱底色"],
  ["04", "心动之后的你"],
  ["05", "你需要的安全感"],
  ["06", "恋爱雷区"],
  ["07", "吸引机制"],
  ["08", "隐藏需求"],
  ["09", "人格恋爱系统"],
  ["10", "关系使用说明"],
  ["11", "人格卡"],
] as const;

export function FreeResultExperience() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [preview, setPreview] = useState<FreePersonalityPreview | null>(null);
  const [step, setStep] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [loadError, setLoadError] = useState("");
  const purchaseUrl = getConfiguredPurchaseUrl(PRODUCT_CONFIG.purchaseUrl);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const raw = localStorage.getItem(FREE_STORAGE_KEYS.lastResult);
    if (!raw) { router.replace("/free"); return; }
    const normalized = parseFreeStoredResult(raw);
    if (!normalized) { router.replace("/free"); return; }
    localStorage.setItem(FREE_STORAGE_KEYS.lastResult, JSON.stringify(normalized));
    setResult(normalized);

    async function loadPreview() {
      try {
        const response = await fetch(`/api/free/personality-preview?type=${encodeURIComponent(normalized!.personalityId)}`);
        const data = await response.json() as FreePersonalityPreview & { message?: string };
        if (!response.ok) throw new Error(data.message || "免费结果读取失败");
        if (!cancelled) setPreview(data);
      } catch {
        if (!cancelled) setLoadError("这份人格速写暂时没有展开，请返回后重新进入结果页。");
      }
    }
    void loadPreview();

    if (new URLSearchParams(window.location.search).get("reveal") === "1") {
      setRevealing(true);
      [240, 480, 720, 960].forEach((delay, index) => timers.push(window.setTimeout(() => setStep(index + 1), delay)));
      timers.push(window.setTimeout(() => setRevealing(false), 1450));
    }
    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
  }, [router]);

  async function handleRedeemed(state: RedeemSuccessState) {
    clearLegacyPremiumAuthorizationStorage();
    const storedAttemptId = localStorage.getItem(STORAGE_KEYS.attemptId);
    if (!state.activeAttemptId || state.activeAttemptId !== storedAttemptId) clearPremiumAttemptStorage();

    const action = getFreeRedeemAction(state);
    if (action === "resume-attempt" && state.activeAttemptId) {
      localStorage.setItem(STORAGE_KEYS.attemptId, state.activeAttemptId);
      router.push("/premium/test");
      return;
    }
    if (action === "start-attempt") {
      await startPremiumAttempt();
      router.push("/premium/test");
      return;
    }
    if (action === "view-result") {
      router.push("/premium/result");
      return;
    }
    throw new Error("该兑换码当前没有可开始的测试。");
  }

  if (!result || (!preview && !loadError)) return <main className="app-shell analysis-page"><p className="eyebrow">正在寻找你的初步人格……</p></main>;
  if (loadError || !preview) return <main className="app-shell analysis-page page-padding"><div><p className="eyebrow">免费人格速写</p><p className="free-load-error">{loadError}</p><Link className="text-button" href="/free">返回免费版首页</Link></div></main>;
  if (revealing) return <ResultReveal step={step} title="正在捕捉你的恋爱倾向……" finalText="你的初步人格出现了。" />;

  return (
    <main className="app-shell free-result-page" style={{ "--personality": preview.primaryColor } as React.CSSProperties}>
      <section className="free-result-hero page-padding">
        <header className="result-top"><p className="eyebrow">01 / 人格身份</p><span className="type-number">{preview.id}号人格</span></header>
        <PersonalityVisual personality={preview} className="free-result-visual" />
        <div className="free-result-identity">
          <p className="eyebrow">你的初步恋爱人格倾向</p>
          <h1>{preview.name}</h1>
          <p className="free-result-tagline">{preview.tagline}</p>
          <div className="trait-row">{preview.keywords.map((trait) => <span key={trait}>○ {trait}</span>)}</div>
        </div>
      </section>

      <section className="free-editorial-section free-why-section page-padding">
        <header className="free-section-heading"><span>02</span><div><p className="eyebrow">为什么你会是这个型</p><h2>第一条关于你的线索</h2></div></header>
        <p className="free-summary-headline">{preview.summaryHeadline}</p>
      </section>

      <PreliminaryRelationshipPreview scores={result.scores} definitions={preview.relationshipPosition} />

      <section className="free-editorial-section free-report-directory page-padding">
        <header className="free-section-heading"><span>04</span><div><p className="eyebrow">完整版报告目录</p><h2>这份档案会继续展开什么</h2></div></header>
        <ol>{reportDirectory.map(([number, title]) => (
          <li key={number}><span>{number}</span><strong>{title}</strong>{number === "03" && <small>{preview.baseHeadline}</small>}</li>
        ))}</ol>
      </section>

      <LockedReportPreview preview={preview} />

      <section id="free-unlock" className="free-unlock-panel free-unlock-v3 page-padding">
        <p className="eyebrow">06 / 解锁完整人格报告</p>
        <h2>继续完成剩余12题，<br />打开你的完整关系档案。</h2>
        <p>免费答案会自动带入。完整版将重新校准四维关系坐标，并展开雷区、隐藏需求与关系使用说明。</p>

        {purchaseUrl ? (
          <a className="primary-button free-cta" href={purchaseUrl} target="_blank" rel="noreferrer">前往购买</a>
        ) : (
          <div className="purchase-unavailable"><span>购买入口</span><p>当前购买链接尚未配置。已有兑换码可直接在本页继续。</p></div>
        )}

        <button className="secondary-button free-redeem-toggle" type="button" onClick={() => setShowRedeem((value) => !value)}>
          {showRedeem ? "收起兑换码输入" : "我已有兑换码"}
        </button>
        {showRedeem && <RedeemCodePanel className="free-redeem-panel" onRedeemed={handleRedeemed} />}
        <Link className="text-button free-retry" href="/free">重新体验免费版</Link>
      </section>
    </main>
  );
}
