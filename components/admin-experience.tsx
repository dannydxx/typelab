"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { getUserFacingError } from "@/lib/user-facing-error";

type Summary = {
  totalCompleted: number;
  personalities: { id: string; count: number }[];
};

export function AdminExperience({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadSummary = useCallback(async () => {
    const response = await fetch("/api/admin/summary", { cache: "no-store" });
    if (response.status === 401) { setAuthenticated(false); return; }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    setSummary(data);
  }, []);

  useEffect(() => { if (authenticated) loadSummary().catch(() => setMessage("统计数据暂时无法加载，请刷新重试。")); }, [authenticated, loadSummary]);
  const maxPersonality = useMemo(() => Math.max(1, ...(summary?.personalities.map((item) => item.count) ?? [1])), [summary]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setAuthenticated(true); setPassword("");
    } catch (cause) { setMessage(getUserFacingError(cause, "登录失败，请稍后再试。")); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); setSummary(null); }

  if (!authenticated) return (
    <main className="admin-page"><form className="admin-login" onSubmit={login}>
      <p className="eyebrow">仅限管理员访问</p><h1>管理后台</h1>
      <div className="field"><label htmlFor="admin-email">管理员邮箱</label><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></div>
      <div className="field"><label htmlFor="admin-password">密码</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required /></div>
      <button className="primary-button" disabled={busy}>{busy ? "正在登录…" : "登录"}</button><p className="error-text" role="alert">{message}</p>
    </form></main>
  );

  return (
    <main className="admin-page"><div className="admin-inner">
      <header className="admin-header"><div><p className="eyebrow">运营管理</p><h1>人格测试数据</h1></div><button className="text-button" onClick={logout}>退出登录</button></header>
      {summary && <section className="admin-section">
        <div className="admin-section-head"><div><p className="eyebrow">匿名结果统计</p><h2>人格结果分布 · 共 {summary.totalCompleted} 次</h2></div></div>
        <div className="bar-list">{summary.personalities.map((item) => <div className="bar-row" key={item.id}><span><small>{item.id}号人格</small>{PERSONALITY_BY_ID[item.id].name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${item.count / maxPersonality * 100}%` }} /></div><strong>{item.count}</strong></div>)}</div>
      </section>}
      <p className="error-text" role="status">{message}</p>
    </div></main>
  );
}
