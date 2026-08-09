"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Questionnaire } from "./questionnaire";
import { FREE_QUESTIONS } from "@/lib/free-questions";
import { FREE_STORAGE_KEYS } from "@/lib/config";
import { calculateScoresForQuestions, getPersonality } from "@/lib/scoring";
import type { AnswerValue, StoredResult } from "@/lib/types";

type FreeProgress = { current: number; answers: Array<AnswerValue | null> };
const emptyProgress = (): FreeProgress => ({ current: 0, answers: Array(FREE_QUESTIONS.length).fill(null) });

export function FreeTestExperience() {
  const router = useRouter();
  const [progress, setProgress] = useState<FreeProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(FREE_STORAGE_KEYS.progress);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as FreeProgress;
        if (parsed.answers?.length === FREE_QUESTIONS.length) setProgress(parsed);
      } catch { localStorage.removeItem(FREE_STORAGE_KEYS.progress); }
    }
    setReady(true);
  }, []);

  function persist(next: FreeProgress) {
    setProgress(next);
    localStorage.setItem(FREE_STORAGE_KEYS.progress, JSON.stringify(next));
  }

  async function selectAnswer(value: AnswerValue) {
    if (moving) return;
    setMoving(true); setError("");
    const answers = [...progress.answers];
    answers[progress.current] = value;
    persist({ ...progress, answers });
    await new Promise((resolve) => setTimeout(resolve, 240));

    if (progress.current < FREE_QUESTIONS.length - 1) {
      persist({ current: progress.current + 1, answers });
      setMoving(false);
      return;
    }

    try {
      const scores = calculateScoresForQuestions(FREE_QUESTIONS, answers);
      const personality = getPersonality(scores);
      const result: StoredResult = {
        attemptId: crypto.randomUUID(),
        personalityId: personality.id,
        scores,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(FREE_STORAGE_KEYS.lastResult, JSON.stringify(result));
      localStorage.removeItem(FREE_STORAGE_KEYS.progress);
      router.replace("/free/result?reveal=1");
    } catch {
      setError("结果生成时开了个小差，请返回检查答案后再试。");
      setMoving(false);
    }
  }

  if (!ready) return <main className="app-shell analysis-page"><p className="eyebrow">正在准备免费测试……</p></main>;
  return <Questionnaire questions={FREE_QUESTIONS} current={progress.current} answers={progress.answers} moving={moving} error={error} label="免费版 · 快速人格" onSelect={selectAnswer} onBack={() => progress.current > 0 && persist({ ...progress, current: progress.current - 1 })} />;
}
