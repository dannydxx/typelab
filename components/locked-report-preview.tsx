import React from "react";
import type { FreePersonalityPreview } from "@/lib/types";

export function LockedReportPreview({ preview }: { preview: FreePersonalityPreview }) {
  return (
    <section className="free-editorial-section locked-report-preview page-padding">
      <header className="free-section-heading">
        <span>05</span>
        <div><p className="eyebrow">属于你的内容已生成</p><h2>尚未翻开的报告章节</h2></div>
      </header>

      <article className="locked-base-preview">
        <p className="locked-chapter-index">03 / 你的恋爱底色</p>
        <h3>{preview.baseHeadline}</h3>
        <p className="locked-continuation"><span aria-hidden="true">⌁</span> 完整分析将在完整版中展开</p>
      </article>

      <article className="locked-boundary-preview">
        <p className="locked-chapter-index">06 / 你的恋爱雷区</p>
        <ol>
          <li><span>01</span><strong>{preview.boundaryFirstTitle}</strong></li>
          <li className="is-locked"><span>02</span><strong><i aria-hidden="true">◇</i> 完整版展开</strong></li>
          <li className="is-locked"><span>03</span><strong><i aria-hidden="true">◇</i> 完整版展开</strong></li>
        </ol>
      </article>

      <article className="locked-os-preview">
        <p className="locked-chapter-index">09 / 人格恋爱系统</p>
        <h3>{preview.innerOSPreview.situation}</h3>
        <div><span>嘴上</span><p>“{preview.innerOSPreview.outer}”</p></div>
        <div className="is-locked"><span>心里</span><p><i aria-hidden="true">◇</i> 完整版展开</p></div>
      </article>
    </section>
  );
}
