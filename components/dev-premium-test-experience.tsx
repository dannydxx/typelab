"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import type { AnswerValue } from "@/lib/types";
import { DevPreviewBanner } from "./dev-preview-banner";
import { Questionnaire } from "./questionnaire";

export function DevPremiumTestExperience() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<AnswerValue | null>>(() => Array(QUESTIONS.length).fill(null));
  const [moving, setMoving] = useState(false);

  async function selectAnswer(value: AnswerValue) {
    if (moving) return;
    setMoving(true);
    const nextAnswers = [...answers];
    nextAnswers[current] = value;
    setAnswers(nextAnswers);
    await new Promise((resolve) => setTimeout(resolve, 240));

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
      setMoving(false);
      return;
    }

    router.push("/dev/premium-preview/result/01");
  }

  return (
    <>
      <DevPreviewBanner />
      <Questionnaire
        questions={QUESTIONS}
        current={current}
        answers={answers}
        moving={moving}
        error=""
        label="完整版 · 恋爱模式"
        notice="当前为内存fixture：不会验证访问码、写入数据库或生成正式结果。"
        devPreview
        optionCards
        onSelect={selectAnswer}
        onBack={() => current > 0 && setCurrent(current - 1)}
      />
    </>
  );
}
