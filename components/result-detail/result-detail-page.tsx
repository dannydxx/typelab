import type { CSSProperties } from "react";
import { PersonalityVisual } from "@/components/personality-visual";
import { DimensionScale } from "@/components/dimension-scale";
import type { Personality, StoredResult } from "@/lib/types";
import { AdviceCard } from "./advice-card";
import { AttractionTags } from "./attraction-tags";
import { BoundaryRanking } from "./boundary-ranking";
import { HeartFlow } from "./heart-flow";
import { InnerOS } from "./inner-os";
import { InnerVoice } from "./inner-voice";
import { KeywordList } from "./keyword-list";
import { PersonalityQuote } from "./personality-quote";
import { PersonalitySummary } from "./personality-summary";
import { RelationshipSlider } from "./relationship-slider";
import { ResultSection } from "./result-section";
import { ResultSharePanel } from "./result-share-panel";
import { SafetyFormula } from "./safety-formula";

const legacyReportSections = [
  ["01", "你的恋爱底色", "base"],
  ["02", "心动之后的你", "inLove"],
  ["03", "你最需要的安全感", "securityNeed"],
  ["04", "你的恋爱雷区", "pitfalls"],
  ["05", "你容易被哪种人吸引", "attraction"],
  ["06", "关系中的隐藏需求", "hiddenNeed"],
  ["07", "给你的恋爱建议", "advice"],
] as const;

const scoreFor = (result: StoredResult, key: "security" | "closeness" | "expression" | "conflict") => result.scores[key];

export function ResultDetailPage({ personality, result, actionMessage, retestBusy, onSave, onCopy, onRetest, onHome }: {
  personality: Personality;
  result: StoredResult;
  actionMessage: string;
  retestBusy: boolean;
  onSave: () => void;
  onCopy: () => void;
  onRetest: () => void;
  onHome: () => void;
}) {
  const style = { "--personality": personality.primaryColor } as CSSProperties;
  if (!personality.v2) return <LegacyResultDetail personality={personality} result={result} actionMessage={actionMessage} retestBusy={retestBusy} onSave={onSave} onCopy={onCopy} onRetest={onRetest} onHome={onHome} />;

  const v2 = personality.v2;
  return (
    <main className="app-shell result-page result-page-v2" style={style}>
      <section className="result-hero v2-hero page-padding">
        <header className="result-top"><p className="eyebrow">00 / 人格封面</p><span className="type-number">{personality.id}号人格</span></header>
        <PersonalityVisual personality={personality} mode="premium" />
        <div className="result-identity">
          <p className="eyebrow">正式人格 · 完整揭晓</p>
          <h1>{personality.name}</h1>
          <p className="result-tagline">{personality.tagline}</p>
          <p className="v2-short-description">{v2.shortDescription}</p>
          <div className="trait-row">{personality.keywords.map((trait) => <span key={trait}>○ {trait}</span>)}</div>
        </div>
      </section>

      <ResultSection number="01" title="人格摘要" className="v2-summary-section">
        <PersonalitySummary summary={v2.summary} />
      </ResultSection>

      <ResultSection number="02" title="关系坐标" className="v2-position-section">
        <div className="relationship-position-list">{v2.relationshipPosition.map((definition) => (
          <RelationshipSlider key={definition.key} definition={definition} score={scoreFor(result, definition.key)} />
        ))}</div>
      </ResultSection>

      <ResultSection number="03" title="你的恋爱底色">
        <div className="v2-editorial-copy"><p className="v2-insight">{v2.base.insight}</p><h3>{v2.base.headline}</h3><p>{v2.base.description}</p></div>
        <KeywordList keywords={v2.base.keywords} />
        <PersonalityQuote>{v2.base.quote}</PersonalityQuote>
      </ResultSection>

      <ResultSection number="04" title="心动之后的你" className="v2-paper-section">
        <div className="v2-editorial-copy"><p className="v2-insight">{v2.heart.insight}</p><h3>{v2.heart.headline}</h3><p>{v2.heart.description}</p></div>
        <HeartFlow stages={v2.heart.stages} />
      </ResultSection>

      <ResultSection number="05" title="你最需要的安全感">
        <div className="v2-editorial-copy"><p className="v2-insight">{v2.safety.insight}</p><h3>{v2.safety.headline}</h3><p>{v2.safety.description}</p></div>
        <SafetyFormula items={v2.safety.formula} />
        <PersonalityQuote>{v2.safety.quote}</PersonalityQuote>
      </ResultSection>

      <ResultSection number="06" title="你的恋爱雷区" className="v2-paper-section">
        <div className="v2-editorial-copy"><h3>{v2.boundaries.headline}</h3><p>{v2.boundaries.intro}</p></div>
        <BoundaryRanking items={v2.boundaries.items} />
      </ResultSection>

      <ResultSection number="07" title="你容易被什么人吸引">
        <div className="v2-editorial-copy"><h3>{v2.attraction.headline}</h3><p>{v2.attraction.description}</p></div>
        <AttractionTags tags={v2.attraction.tags} />
        <div className="hidden-attraction"><span>隐性心动类型</span><p>{v2.attraction.hiddenAttraction}</p></div>
      </ResultSection>

      <ResultSection number="08" title="关系中的隐藏需求" className="v2-needs-section">
        <div className="v2-editorial-copy"><h3>{v2.needs.headline}</h3><p>{v2.needs.description}</p></div>
        <ul className="real-needs">{v2.needs.needs.map((need, index) => <li key={need}><span>0{index + 1}</span>{need}</li>)}</ul>
        <InnerVoice outer={v2.needs.outerVoice} inner={v2.needs.innerVoice} />
        <PersonalityQuote>{v2.needs.quote}</PersonalityQuote>
      </ResultSection>

      <ResultSection number="09" title="人格恋爱系统" className="v2-os-section">
        <p className="v2-section-intro">不是诊断，只是把你在关系里的自动反应翻译成两段容易看懂的内心弹幕。</p>
        <InnerOS items={v2.innerOS} />
      </ResultSection>

      <ResultSection number="10" title="你的恋爱使用说明">
        <div className="advice-list">{v2.advice.map((advice, index) => <AdviceCard advice={advice} index={index} key={advice.title} />)}</div>
      </ResultSection>

      <ResultSection number="11" title="人格分享卡" className="v2-share-section">
        <ResultSharePanel share={v2.share} actionMessage={actionMessage} retestBusy={retestBusy} onSave={onSave} onCopy={onCopy} onRetest={onRetest} onHome={onHome} />
      </ResultSection>
    </main>
  );
}

function LegacyResultDetail({ personality, result, actionMessage, retestBusy, onSave, onCopy, onRetest, onHome }: {
  personality: Personality;
  result: StoredResult;
  actionMessage: string;
  retestBusy: boolean;
  onSave: () => void;
  onCopy: () => void;
  onRetest: () => void;
  onHome: () => void;
}) {
  const report = personality.report;
  return <main className="app-shell result-page" style={{ "--personality": personality.primaryColor } as CSSProperties}>
    <section className="result-hero page-padding">
      <header className="result-top"><p className="eyebrow">16型恋爱人格测试</p><span className="type-number">{personality.id}号人格</span></header>
      <PersonalityVisual personality={personality} mode="premium" />
      <div className="result-identity"><p className="eyebrow">正式人格 · 完整揭晓</p><h1>{personality.name}</h1><p className="result-tagline">{personality.tagline}</p><div className="trait-row">{personality.keywords.map((trait) => <span key={trait}>○ {trait}</span>)}</div></div>
    </section>
    <section className="dimensions page-padding">
      <p className="eyebrow">四维关系坐标</p><h2 className="section-heading">你在关系里的位置</h2>
      <DimensionScale title="安全感" left="稳定" right="敏感" score={result.scores.security} />
      <DimensionScale title="亲密节奏" left="独立" right="靠近" score={result.scores.closeness} />
      <DimensionScale title="表达方式" left="克制" right="直接" score={result.scores.expression} />
      <DimensionScale title="冲突处理" left="冷静" right="解决" score={result.scores.conflict} />
    </section>
    <section className="report page-padding">
      <p className="eyebrow">完整人格档案</p><h2 className="section-heading">一份关于你如何去爱的档案</h2>
      {legacyReportSections.map(([number, title, key]) => {
        const content = report[key];
        return <article className="report-block" key={key}><span className="report-number">{number}</span><h2>{title}</h2>{Array.isArray(content) ? <ul>{content.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{content}</p>}</article>;
      })}
      <ResultSharePanel actionMessage={actionMessage} retestBusy={retestBusy} onSave={onSave} onCopy={onCopy} onRetest={onRetest} onHome={onHome} />
    </section>
  </main>;
}
