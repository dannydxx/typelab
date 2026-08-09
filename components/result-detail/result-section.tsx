import type { ReactNode } from "react";

export function ResultSection({
  number,
  en,
  title,
  children,
  className = "",
}: {
  number: string;
  en: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`v2-section page-padding ${className}`}>
      <header className="v2-section-header">
        <span className="v2-section-number">{number}</span>
        <div><p className="eyebrow">{en}</p><h2>{title}</h2></div>
      </header>
      {children}
    </section>
  );
}
