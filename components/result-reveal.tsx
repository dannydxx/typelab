export function ResultReveal({ step, title = "正在读取你的恋爱模式……", finalText = "找到你的恋爱人格了。" }: { step: number; title?: string; finalText?: string }) {
  return (
    <main className="app-shell analysis-page">
      <div className="analysis-box">
        <p className="eyebrow">正在解析人格</p><h1 className="analysis-title">{title}</h1>
        {["安全感", "亲密节奏", "表达方式", "冲突方式"].map((label, index) => (
          <div key={label} className={`analysis-row ${step > index ? "done" : ""}`}><span>{label}</span><span className="analysis-dot" /></div>
        ))}
        {step === 4 && <p className="eyebrow" style={{ marginTop: 36 }}>{finalText}</p>}
      </div>
    </main>
  );
}
