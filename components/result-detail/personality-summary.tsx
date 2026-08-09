import type { PersonalityV2 } from "@/lib/types";
import { TraitMetrics } from "./trait-metrics";

export function PersonalitySummary({ summary }: { summary: PersonalityV2["summary"] }) {
  return <div className="personality-summary">
    <h3>{summary.headline}</h3>
    <p className="v2-body-lead">{summary.description}</p>
    <TraitMetrics metrics={summary.metrics} />
  </div>;
}
