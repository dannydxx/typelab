export function SafetyFormula({ items }: { items: string[] }) {
  return <div className="safety-formula" aria-label={`安全感公式：${items.join("加")}`}>
    {items.map((item, index) => <div key={item}>{index > 0 && <span>＋</span>}<strong>{item}</strong></div>)}
  </div>;
}
