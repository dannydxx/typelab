export function AttractionTags({ tags }: { tags: string[] }) {
  return <div className="attraction-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}
