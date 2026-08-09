export function HeartFlow({ stages }: { stages: string[] }) {
  return <ol className="heart-flow">{stages.map((stage, index) => (
    <li key={stage}><span>{String(index + 1).padStart(2, "0")}</span><p>{stage}</p></li>
  ))}</ol>;
}
