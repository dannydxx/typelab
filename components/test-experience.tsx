"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import { STORAGE_KEYS } from "@/lib/config";
import type { AnswerValue } from "@/lib/types";
import { Questionnaire } from "./questionnaire";

type Progress = { current: number; answers: Array<AnswerValue | null> };
const emptyProgress = (): Progress => ({ current: 0, answers: Array(20).fill(null) });

export function TestExperience() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1") {
      setReady(true);
      return;
    }
    const session = localStorage.getItem(STORAGE_KEYS.session);
    const attempt = localStorage.getItem(STORAGE_KEYS.attemptId);
    if (!session || !attempt) { router.replace("/premium"); return; }
    const stored = localStorage.getItem(STORAGE_KEYS.progress);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Progress;
        if (parsed.answers?.some((answer) => answer !== null)) { setProgress(parsed); setResumePrompt(true); }
      } catch { localStorage.removeItem(STORAGE_KEYS.progress); }
    }
    setReady(true);
  }, [router]);

  function persist(next: Progress) {
    setProgress(next);
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
  }

  async function selectAnswer(value: AnswerValue) {
    if (moving) return;
    setMoving(true); setError("");
    const answers = [...progress.answers];
    answers[progress.current] = value;
    const answered = { ...progress, answers };
    persist(answered);
    await new Promise((resolve) => setTimeout(resolve, 240));

    if (progress.current < QUESTIONS.length - 1) {
      persist({ current: progress.current + 1, answers });
      setMoving(false);
      return;
    }

    try {
      const session = localStorage.getItem(STORAGE_KEYS.session)!;
      const attemptId = localStorage.getItem(STORAGE_KEYS.attemptId)!;
      const response = await fetch("/api/attempts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-redeem-session": session },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "结果生成失败，请稍后再试。");
      localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(data.result));
      localStorage.removeItem(STORAGE_KEYS.progress);
      router.replace("/premium/result?reveal=1");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "网络好像开了个小差，请稍后再试。");
      setMoving(false);
    }
  }

  if (!ready) return <main className="app-shell analysis-page"><p className="eyebrow">正在准备题目……</p></main>;
  return (
    <Questionnaire questions={QUESTIONS} current={progress.current} answers={progress.answers} moving={moving} error={error} label="完整版 · 恋爱模式" onSelect={selectAnswer} onBack={() => progress.current > 0 && persist({ ...progress, current: progress.current - 1 })}>
      {resumePrompt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="resume-title">
          <div className="modal">
            <p className="eyebrow">Unfinished portrait</p><h2 id="resume-title">检测到上次未完成的测试</h2>
            <p>你已经回答了部分问题，可以从离开的地方继续。</p>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => setResumePrompt(false)}>继续测试</button>
              <button className="secondary-button" onClick={() => { persist(emptyProgress()); setResumePrompt(false); }}>重新开始</button>
            </div>
          </div>
        </div>
      )}
    </Questionnaire>
  );
}
