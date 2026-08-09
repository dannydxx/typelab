export function InnerVoice({ outer, inner }: { outer: string; inner: string }) {
  return <div className="inner-voice">
    <div><span>嘴上</span><p>{outer}</p></div>
    <div><span>心里</span><p>{inner}</p></div>
  </div>;
}
