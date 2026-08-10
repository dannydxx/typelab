"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import { STORAGE_KEYS } from "@/lib/config";
import {
  createEmptyPremiumProgress,
  findFirstUnansweredIndex,
  parsePremiumProgress,
} from "@/lib/free-answer-transfer";
import type { AnswerValue, PremiumProgress } from "@/lib/types";
import type { PremiumSessionState } from "@/lib/types";
import { Questionnaire } from "./questionnaire";
import { getUserFacingError } from "@/lib/user-facing-error";
import { clearPremiumClientStorage } from "@/lib/premium-client-storage";

const emptyProgress = (attemptId = ""): PremiumProgress => createEmptyPremiumProgress(attemptId);

export function TestExperience() {
  const router = useRouter();
  const [progress, setProgress] = useState<PremiumProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [transferNotice, setTransferNotice] = useState("");
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1") {
      setReady(true);
      return;
    }
    let cancelled = false;
    async function loadAuthorizedAttempt() {
      try {
        const response = await fetch("/api/redeem/session", { credentials: "same-origin", cache: "no-store" });
        const state = await response.json() as PremiumSessionState;
        if (cancelled) return;
        if (!response.ok || !state.authenticated) {
          clearPremiumClientStorage();
          router.replace("/premium");
          return;
        }
        if (!state.hasActiveAttempt || !state.activeAttemptId) {
          router.replace(state.hasCompletedResult ? "/premium/result" : "/premium");
          return;
        }

        const attempt = state.activeAttemptId;
        localStorage.setItem(STORAGE_KEYS.attemptId, attempt);
        const stored = localStorage.getItem(STORAGE_KEYS.progress);
        if (stored) {
          const parsed = parsePremiumProgress(stored, attempt);
          if (!parsed) {
            localStorage.removeItem(STORAGE_KEYS.progress);
            setProgress(emptyProgress(attempt));
          } else if (parsed.source === "free-transfer") {
            setProgress(parsed);
            const transferred = parsed.answers.filter((answer) => answer !== null).length;
            setTransferNotice(`已带入免费版的${transferred}道答案，继续完成剩余${QUESTIONS.length - transferred}题`);
          } else if (parsed.answers.some((answer) => answer !== null)) {
            setProgress(parsed);
            setResumePrompt(true);
          } else setProgress(parsed);
        } else setProgress(emptyProgress(attempt));
        setReady(true);
      } catch {
        if (!cancelled) {
          clearPremiumClientStorage();
          router.replace("/premium");
        }
      }
    }
    void loadAuthorizedAttempt();
    return () => { cancelled = true; };
  }, [router]);

  function persist(next: PremiumProgress) {
    setProgress(next);
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(next));
  }

  async function selectAnswer(value: AnswerValue) {
    if (moving) return;
    setMoving(true); setError("");
    const answers = [...progress.answers];
    answers[progress.current] = value;
    const answered: PremiumProgress = { ...progress, answers, source: "premium" };
    setTransferNotice("");
    persist(answered);
    await new Promise((resolve) => setTimeout(resolve, 240));

    const nextUnanswered = findFirstUnansweredIndex(answers);
    if (nextUnanswered !== -1) {
      persist({ ...answered, current: nextUnanswered });
      setMoving(false);
      return;
    }

    try {
      const attemptId = localStorage.getItem(STORAGE_KEYS.attemptId)!;
      const response = await fetch("/api/attempts/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await response.json();
      if (response.status === 401) {
        clearPremiumClientStorage();
        router.replace("/premium");
        return;
      }
      if (!response.ok) throw new Error(data.message || "结果生成失败，请稍后再试。");
      localStorage.removeItem(STORAGE_KEYS.progress);
      router.replace("/premium/result?reveal=1");
    } catch (cause) {
      setError(getUserFacingError(cause, "网络好像开了个小差，请稍后再试。"));
      setMoving(false);
    }
  }

  if (!ready) return <main className="app-shell analysis-page"><p className="eyebrow">正在准备题目……</p></main>;
  return (
    <Questionnaire questions={QUESTIONS} current={progress.current} answers={progress.answers} moving={moving} error={error} label="完整版 · 恋爱模式" notice={transferNotice} onSelect={selectAnswer} onBack={() => progress.current > 0 && persist({ ...progress, current: progress.current - 1 })}>
      {resumePrompt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="resume-title">
          <div className="modal">
            <p className="eyebrow">未完成的测试</p><h2 id="resume-title">检测到上次未完成的测试</h2>
            <p>你已经回答了部分问题，可以从离开的地方继续。</p>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => setResumePrompt(false)}>继续测试</button>
              <button className="secondary-button" onClick={() => { persist(emptyProgress(progress.attemptId)); setResumePrompt(false); }}>重新开始</button>
            </div>
          </div>
        </div>
      )}
    </Questionnaire>
  );
}
