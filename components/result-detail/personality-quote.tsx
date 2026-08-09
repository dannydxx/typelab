export function PersonalityQuote({ children }: { children: string }) {
  return <blockquote className="personality-quote"><span>“</span><p>{children}</p></blockquote>;
}
