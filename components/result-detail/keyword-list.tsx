export function KeywordList({ keywords }: { keywords: string[] }) {
  return <div className="v2-keyword-list">{keywords.map((keyword, index) => (
    <span key={keyword}><small>0{index + 1}</small>{keyword}</span>
  ))}</div>;
}
