"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PERSONALITY_BY_ID } from "@/lib/personalities";

type Summary = {
  codes: { total: number; unused: number; active: number; expired: number; disabled: number };
  totalCompleted: number;
  personalities: { id: string; count: number }[];
  batches: { batch_id: string; created_at: string; total_count: number; unused_count: number; last_exported_at: string | null }[];
};

type CodeRecord = {
  code: string; status: string; created_at: string; activated_at: string | null; expires_at: string | null;
  completed_count: number; max_completed_count: number; batch_id: string; exported_at: string | null;
};

export function AdminExperience({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [count, setCount] = useState(100);
  const [search, setSearch] = useState("");
  const [foundCode, setFoundCode] = useState<CodeRecord | null>(null);
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
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "登录失败，请稍后再试。"); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); setSummary(null); }

  async function generate() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/codes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setMessage(`成功生成 ${data.count} 个兑换码，批次 ${data.batchId}。`); await loadSummary();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "生成失败，请稍后再试。"); }
    finally { setBusy(false); }
  }

  async function findCode(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/codes?code=${encodeURIComponent(search)}`);
      const data = await response.json(); if (!response.ok) throw new Error(data.message); setFoundCode(data.code);
    } catch (cause) { setFoundCode(null); setMessage(cause instanceof Error ? cause.message : "查询失败。"); }
    finally { setBusy(false); }
  }

  async function updateCode(action: "disable" | "enable" | "extend") {
    if (!foundCode) return; setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: foundCode.code, action, hours: 24 }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setMessage("兑换码状态已更新。"); setSearch(foundCode.code); await findCode({ preventDefault() {} } as React.FormEvent); await loadSummary();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "更新失败。"); }
    finally { setBusy(false); }
  }

  if (!authenticated) return (
    <main className="admin-page"><form className="admin-login" onSubmit={login}>
      <p className="eyebrow">仅限管理员访问</p><h1>管理后台</h1>
      <div className="field"><label htmlFor="admin-email">管理员邮箱</label><input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></div>
      <div className="field"><label htmlFor="admin-password">密码</label><input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" minLength={8} required /></div>
      <button className="primary-button" disabled={busy}>{busy ? "正在登录…" : "登录"}</button><p className="error-text" role="alert">{message}</p>
    </form></main>
  );

  return (
    <main className="admin-page"><div className="admin-inner">
      <header className="admin-header"><div><p className="eyebrow">运营管理</p><h1>兑换码与测试数据</h1></div><button className="text-button" onClick={logout}>退出登录</button></header>
      {summary && <>
        <section className="stats-grid">
          {["total", "unused", "active", "expired", "disabled"].map((key) => <div className="stat" key={key}><span>{{ total: "卡密总数", unused: "未使用", active: "已激活", expired: "已过期", disabled: "已禁用" }[key as keyof Summary["codes"]]}</span><strong>{summary.codes[key as keyof Summary["codes"]]}</strong></div>)}
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">兑换码批次</p><h2>生成与导出</h2></div><div className="inline-controls">
            <select className="admin-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[10,50,100,500,1000].map((value) => <option key={value}>{value}</option>)}</select>
            <button className="primary-button" onClick={generate} disabled={busy}>生成兑换码</button>
            <a className="primary-button" href="/api/admin/codes/export?format=simple">导出 CSV</a>
            <a className="primary-button" href="/api/admin/codes/export?format=product">导出带商品名</a>
          </div></div>
          <table className="admin-table"><thead><tr><th>批次</th><th>生成时间</th><th>数量</th><th>未使用</th><th>最近导出</th></tr></thead><tbody>{summary.batches.map((batch) => <tr key={batch.batch_id}><td>{batch.batch_id}</td><td>{new Date(batch.created_at).toLocaleString("zh-CN")}</td><td>{batch.total_count}</td><td>{batch.unused_count}</td><td>{batch.last_exported_at ? new Date(batch.last_exported_at).toLocaleString("zh-CN") : "—"}</td></tr>)}</tbody></table>
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">兑换码查询</p><h2>查询与操作</h2></div><form className="inline-controls" onSubmit={findCode}><input className="admin-select" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="LOVE-XXXX-XXXX" /><button className="primary-button">查询</button></form></div>
          {foundCode && <><table className="admin-table"><tbody>
            <tr><th>兑换码</th><td>{foundCode.code}</td><th>状态</th><td>{foundCode.status}</td></tr>
            <tr><th>生成</th><td>{new Date(foundCode.created_at).toLocaleString("zh-CN")}</td><th>批次</th><td>{foundCode.batch_id}</td></tr>
            <tr><th>激活</th><td>{foundCode.activated_at ? new Date(foundCode.activated_at).toLocaleString("zh-CN") : "—"}</td><th>过期</th><td>{foundCode.expires_at ? new Date(foundCode.expires_at).toLocaleString("zh-CN") : "—"}</td></tr>
            <tr><th>完成次数</th><td>{foundCode.completed_count} / {foundCode.max_completed_count}</td><th>已导出</th><td>{foundCode.exported_at ? "是" : "否"}</td></tr>
          </tbody></table><div className="inline-controls" style={{ marginTop: 18 }}><button className="secondary-button" onClick={() => updateCode("disable")}>禁用</button><button className="secondary-button" onClick={() => updateCode("enable")}>重新启用</button><button className="secondary-button" onClick={() => updateCode("extend")}>延长 24 小时</button></div></>}
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">匿名结果统计</p><h2>人格结果分布 · 共 {summary.totalCompleted} 次</h2></div></div>
          <div className="bar-list">{summary.personalities.map((item) => <div className="bar-row" key={item.id}><span><small>TYPE {item.id}</small>{PERSONALITY_BY_ID[item.id].name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${item.count / maxPersonality * 100}%` }} /></div><strong>{item.count}</strong></div>)}</div>
        </section>
      </>}
      <p className="error-text" role="status">{message}</p>
    </div></main>
  );
}
