"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { getUserFacingError } from "@/lib/user-facing-error";
import type { AccessCodeBatchSummary } from "@/lib/types";

type Summary = {
  totalCompleted: number;
  personalities: { id: string; count: number }[];
  inventory: { total: number; unused: number; active: number; expired: number; revoked: number };
  batches: AccessCodeBatchSummary[];
};

export function AdminExperience({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batchLabel, setBatchLabel] = useState("");
  const [batchCount, setBatchCount] = useState(100);
  const [exportFormat, setExportFormat] = useState<"csv" | "txt">("csv");
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

  async function generateBatch(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/access-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: batchLabel, count: batchCount, format: exportFormat }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "访问码生成失败。");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `access-codes-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setBatchLabel("");
      setMessage("访问码已生成并开始下载。明文只提供这一次，请妥善保存导出文件。");
      await loadSummary();
    } catch (cause) { setMessage(getUserFacingError(cause, "访问码生成失败，请稍后再试。")); }
    finally { setBusy(false); }
  }

  async function revokeUnusedBatch(batch: AccessCodeBatchSummary) {
    if (!window.confirm(`仅撤销“${batch.label}”中尚未激活的 ${batch.unusedCount} 个访问码？已激活用户不会受影响。`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/access-codes/revoke-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.id }),
      });
      const data = await response.json() as { message?: string; revokedCount?: number };
      if (!response.ok) throw new Error(data.message || "批次撤销失败。");
      setMessage(`已撤销 ${data.revokedCount ?? 0} 个未使用访问码；已激活用户未受影响。`);
      await loadSummary();
    } catch (cause) { setMessage(getUserFacingError(cause, "批次撤销失败，请稍后再试。")); }
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
      <header className="admin-header"><div><p className="eyebrow">运营管理</p><h1>访问码库存</h1></div><button className="text-button" onClick={logout}>退出登录</button></header>
      {summary && <>
        <section className="stats-grid" aria-label="访问码库存概览">
          {Object.entries({ 总数: summary.inventory.total, 未使用: summary.inventory.unused, 已激活: summary.inventory.active, 已过期: summary.inventory.expired, 已撤销: summary.inventory.revoked }).map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">一次性明文导出</p><h2>创建 Access Code 批次</h2></div></div>
          <form className="access-batch-form" onSubmit={generateBatch}>
            <div className="field"><label htmlFor="batch-label">批次名称</label><input id="batch-label" value={batchLabel} onChange={(event) => setBatchLabel(event.target.value)} placeholder="例如：小红书恋爱人格第一批500份" maxLength={120} required /></div>
            <div className="inline-controls">
              <select className="admin-select" value={batchCount} onChange={(event) => setBatchCount(Number(event.target.value))}>{[10, 50, 100, 500, 1000].map((count) => <option key={count} value={count}>{count} 个</option>)}</select>
              <select className="admin-select" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "csv" | "txt")}><option value="csv">CSV</option><option value="txt">TXT</option></select>
              <button className="primary-button" disabled={busy}>{busy ? "正在生成……" : "生成并下载"}</button>
            </div>
            <p className="admin-help">数据库只保存安全摘要；明文访问码只在本次下载中出现，之后无法重新读取。</p>
          </form>
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">批次管理</p><h2>最近生成批次</h2></div></div>
          <table className="admin-table"><thead><tr><th>批次</th><th>总数</th><th>未使用</th><th>已激活</th><th>已过期</th><th>已撤销</th><th>测试期</th><th>库存处理</th></tr></thead><tbody>{summary.batches.map((batch) => <tr key={batch.id}><td><strong>{batch.label}</strong><small>{new Date(batch.createdAt).toLocaleDateString("zh-CN")}</small></td><td>{batch.codeCount}</td><td>{batch.unusedCount}</td><td>{batch.activeCount}</td><td>{batch.expiredCount}</td><td>{batch.revokedCount}</td><td>{batch.validityHours}小时</td><td>{batch.unusedCount > 0 ? <button className="text-button" disabled={busy} onClick={() => revokeUnusedBatch(batch)}>撤销未使用码</button> : "—"}</td></tr>)}</tbody></table>
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><div><p className="eyebrow">匿名结果统计</p><h2>人格结果分布 · 共 {summary.totalCompleted} 次</h2></div></div>
          <div className="bar-list">{summary.personalities.map((item) => <div className="bar-row" key={item.id}><span><small>{item.id}号人格</small>{PERSONALITY_BY_ID[item.id].name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${item.count / maxPersonality * 100}%` }} /></div><strong>{item.count}</strong></div>)}</div>
        </section>
      </>}
      <p className="error-text" role="status">{message}</p>
    </div></main>
  );
}
