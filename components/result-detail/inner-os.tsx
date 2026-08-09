import type { PersonalityV2 } from "@/lib/types";

export function InnerOS({ items }: { items: PersonalityV2["innerOS"] }) {
  return <div className="inner-os">{items.map((item, index) => (
    <article key={item.situation}>
      <header><span>SCENE {String(index + 1).padStart(2, "0")}</span><h3>{item.situation}</h3></header>
      <div><small>表面系统</small><p>{item.outer}</p></div>
      <div><small>内心弹幕</small><p>{item.inner}</p></div>
    </article>
  ))}</div>;
}
