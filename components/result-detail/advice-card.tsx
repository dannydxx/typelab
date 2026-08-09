import type { PersonalityV2 } from "@/lib/types";

export function AdviceCard({ advice, index }: { advice: PersonalityV2["advice"][number]; index: number }) {
  return <article className="advice-card">
    <span className="advice-index">0{index + 1}</span>
    <p className="eyebrow">{advice.situation}</p>
    <h3>{advice.title}</h3>
    <p className="advice-explanation">{advice.explanation}</p>
    <div className="advice-language"><p><small>不要说</small>{advice.dontSay}</p><p><small>可以换成</small>{advice.trySay}</p></div>
  </article>;
}
