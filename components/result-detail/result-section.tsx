import type { ReactNode } from "react";

export function ResultSection({
  number,
  title,
  children,
  className = "",
}: {
  number: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`v2-section page-padding ${className}`}>
      <header className="v2-section-header">
        <span className="v2-section-number">{number}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
