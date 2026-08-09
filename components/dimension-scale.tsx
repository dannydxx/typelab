import { scoreToPercent } from "@/lib/scoring";

export function DimensionScale({ title, en, left, right, score }: { title: string; en: string; left: string; right: string; score: number }) {
  return (
    <div className="dimension-scale">
      <div className="dimension-head"><strong>{title}</strong><small>{en}</small></div>
      <div className="scale-labels"><span>{left}</span><span>{right}</span></div>
      <div className="scale-track" aria-label={`${title}：${score}，范围负10到正10`}>
        <span className="scale-dot" style={{ left: `${scoreToPercent(score)}%` }} />
      </div>
    </div>
  );
}
