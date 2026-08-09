import { scoreToPercent } from "@/lib/scoring";

export function DimensionScale({ title, left, right, score }: { title: string; left: string; right: string; score: number }) {
  return (
    <div className="dimension-scale">
      <div className="dimension-head"><strong>{title}</strong></div>
      <div className="scale-labels"><span>{left}</span><span>{right}</span></div>
      <div className="scale-track" aria-label={`${title}：${score}，范围负10到正10`}>
        <span className="scale-dot" style={{ left: `${scoreToPercent(score)}%` }} />
      </div>
    </div>
  );
}
