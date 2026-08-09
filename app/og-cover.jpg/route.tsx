import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", alignItems: "center", background: "#f3f0e9", color: "#242321", padding: "76px" }}>
      <div style={{ position: "absolute", right: 50, top: -35, fontSize: 210, color: "#dedbd2", letterSpacing: -20 }}>01—16</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 20, letterSpacing: 7, color: "#77736c" }}>16型恋爱人格测试</div>
        <div style={{ fontSize: 76, marginTop: 30, fontFamily: "serif" }}>16型恋爱人格测试</div>
        <div style={{ display: "flex", fontSize: 29, marginTop: 34, color: "#55524c" }}>有些人越喜欢越主动，有些人越喜欢反而越安静。</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
