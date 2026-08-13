"use client";

import type { AnswerValue, Question } from "@/lib/types";

export function Questionnaire({
  questions,
  current,
  answers,
  moving,
  error,
  label,
  notice,
  devPreview = false,
  optionCards = false,
  onSelect,
  onBack,
  children,
}: {
  questions: Question[];
  current: number;
  answers: Array<AnswerValue | null>;
  moving: boolean;
  error: string;
  label: string;
  notice?: string;
  devPreview?: boolean;
  optionCards?: boolean;
  onSelect: (value: AnswerValue) => void;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  const question = questions[current];
  return (
    <main className={`app-shell test-page page-padding${devPreview ? " test-page--dev-preview" : ""}`}>
      <header>
        <div className="test-head"><p className="eyebrow">{label}</p><span className="type-number">{String(current + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
        {notice && <p role="status" style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>{notice}</p>}
      </header>
      <section className="question-stage" key={question.id}>
        <p className="question-number">第 {String(current + 1).padStart(2, "0")} 题</p>
        <h1 className="question-title">{question.prompt}</h1>
        <div className={`options${optionCards ? " options--cards" : ""}`}>
          {question.options.map((option, index) => (
            <button key={option.value} className={`option-button${optionCards ? " option-button--card" : ""} ${answers[current] === option.value ? "selected" : ""}`} onClick={() => onSelect(option.value)} disabled={moving} aria-pressed={answers[current] === option.value}>
              <span>{optionCards ? String(index + 1).padStart(2, "0") : index + 1}</span><span>{option.label}</span>
            </button>
          ))}
        </div>
        <p className="error-text" role="alert">{error}</p>
      </section>
      <footer className="test-footer">
        <button className="text-button" onClick={onBack} disabled={current === 0}>← 返回上一题</button>
        <span className="eyebrow">凭第一直觉选择</span>
      </footer>
      {children}
    </main>
  );
}
