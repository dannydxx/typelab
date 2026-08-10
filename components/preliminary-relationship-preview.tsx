import React from "react";
import type { DimensionScores, FreePersonalityPreview } from "@/lib/types";

export function freeScoreToPercent(score: number) {
  return Math.max(0, Math.min(100, ((score + 4) / 8) * 100));
}

export function PreliminaryRelationshipPreview({
  scores,
  definitions,
}: {
  scores: DimensionScores;
  definitions: FreePersonalityPreview["relationshipPosition"];
}) {
  return (
    <section className="free-editorial-section free-preliminary page-padding">
      <header className="free-section-heading">
        <span>03</span>
        <div><p className="eyebrow">8题初步关系倾向</p><h2>你在关系里的初步位置</h2></div>
      </header>
      <div className="free-position-list">
        {definitions.map((definition) => {
          const score = scores[definition.key];
          return (
            <div className="free-position-row" key={definition.key}>
              <strong>{definition.label}</strong>
              <div className="scale-labels"><span>{definition.left}</span><span>{definition.right}</span></div>
              <div className="free-position-track" aria-label={`${definition.label}：8题初步位置${Math.round(freeScoreToPercent(score))}%`}>
                <span className="free-position-dot" style={{ left: `${freeScoreToPercent(score)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="free-calibration-note">这是基于8道精选题得到的初步位置，完整版将通过20道题重新校准。</p>
    </section>
  );
}
