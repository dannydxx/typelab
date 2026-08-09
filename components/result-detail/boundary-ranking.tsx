import type { PersonalityV2 } from "@/lib/types";

export function BoundaryRanking({ items }: { items: PersonalityV2["boundaries"]["items"] }) {
  return <ol className="boundary-ranking">{items.map((item, index) => (
    <li key={item.title}><span>雷区 {index + 1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></li>
  ))}</ol>;
}
