import type { PersonalityMetric } from "@/lib/types";

export function TraitMetrics({ metrics }: { metrics: PersonalityMetric[] }) {
  return <div className="trait-metrics">{metrics.map((metric) => (
    <article className="trait-metric" key={metric.label}>
      <div className="trait-metric-head"><strong>{metric.label}</strong><span>{metric.level}</span></div>
      <div className="trait-metric-track" aria-label={`${metric.label}：${metric.value}，满分100`}>
        <span style={{ width: `${metric.value}%` }} />
      </div>
      <p>{metric.description}</p>
    </article>
  ))}</div>;
}
