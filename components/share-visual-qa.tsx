"use client";

import { useEffect, useState } from "react";
import { createFreeShareCard } from "@/lib/free-share-card";
import { createPremiumShareCard } from "@/lib/premium-share-card";
import type { FreePersonalityPreview, Personality, StoredResult } from "@/lib/types";
import styles from "./share-visual-qa.module.css";

type ShareVisualQaEntry = {
  personality: Personality;
  freePreview: FreePersonalityPreview;
  result: StoredResult;
};

type GeneratedCards = Record<string, {
  freeUrl?: string;
  premiumUrl?: string;
  error?: string;
}>;

type CardFilter = "all" | "free" | "premium";

export function ShareVisualQa({ entries }: { entries: ShareVisualQaEntry[] }) {
  const [cards, setCards] = useState<GeneratedCards>({});
  const [completed, setCompleted] = useState(0);
  const [filter, setFilter] = useState<CardFilter>("all");

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function generateAllCards() {
      for (const entry of entries) {
        try {
          const [freeBlob, premiumBlob] = await Promise.all([
            createFreeShareCard(entry.freePreview),
            createPremiumShareCard(entry.personality, entry.result),
          ]);
          const freeUrl = URL.createObjectURL(freeBlob);
          const premiumUrl = URL.createObjectURL(premiumBlob);

          if (cancelled) {
            URL.revokeObjectURL(freeUrl);
            URL.revokeObjectURL(premiumUrl);
            return;
          }

          objectUrls.push(freeUrl, premiumUrl);
          setCards((current) => ({
            ...current,
            [entry.personality.id]: { freeUrl, premiumUrl },
          }));
        } catch {
          if (!cancelled) {
            setCards((current) => ({
              ...current,
              [entry.personality.id]: { error: "该组分享卡生成失败，请刷新后重试。" },
            }));
          }
        } finally {
          if (!cancelled) setCompleted((current) => current + 1);
        }
      }
    }

    void generateAllCards();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [entries]);

  return (
    <main className={styles.page} id="share-qa-top">
      <header className={styles.header}>
        <p>开发环境 · 分享卡视觉验收</p>
        <h1>16型人格分享卡总览</h1>
        <div className={styles.status} role="status">
          {completed < entries.length ? `正在生成 ${completed} / ${entries.length}` : "32张分享卡已全部生成"}
        </div>
      </header>

      <nav className={styles.qaNavigation} aria-label="分享卡验收导航">
        <div className={styles.filterGroup} aria-label="卡片类型筛选">
          {([
            ["all", "全部 32 张"],
            ["free", "仅 Free"],
            ["premium", "仅 Premium"],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={filter === value}
              className={filter === value ? styles.filterActive : undefined}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.typeIndex} aria-label="TYPE 快速定位">
          {entries.map(({ personality }) => (
            <a href={`#share-qa-type-${personality.id}`} key={personality.id}>
              {personality.id}
            </a>
          ))}
        </div>
      </nav>

      <div className={styles.typeGrid}>
        {entries.map(({ personality }) => {
          const generated = cards[personality.id];
          return (
            <section className={styles.typeSection} id={`share-qa-type-${personality.id}`} key={personality.id}>
              <div className={styles.typeHeading}>
                <span>TYPE {personality.id}</span>
                <h2>{personality.name}</h2>
                <a href="#share-qa-top" aria-label="返回分享卡总览顶部">↑ 顶部</a>
              </div>

              {generated?.error ? (
                <p className={styles.error}>{generated.error}</p>
              ) : (
                <div className={styles.cardPair}>
                  {filter !== "premium" && (
                    <ShareCardPreview
                      label="Free Share Card"
                      imageUrl={generated?.freeUrl}
                      filename={`TYPE${personality.id}-${personality.name}-Free.png`}
                    />
                  )}
                  {filter !== "free" && (
                    <ShareCardPreview
                      label="Premium Share Card"
                      imageUrl={generated?.premiumUrl}
                      filename={`TYPE${personality.id}-${personality.name}-Premium.png`}
                    />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ShareCardPreview({ label, imageUrl, filename }: { label: string; imageUrl?: string; filename: string }) {
  return (
    <article className={styles.cardPreview}>
      <div className={styles.cardLabel}>
        <h3>{label}</h3>
        {imageUrl && <a href={imageUrl} download={filename}>保存PNG</a>}
      </div>
      <div className={styles.imageFrame} aria-busy={!imageUrl}>
        {imageUrl ? (
          // The blob URL is produced by the existing share-card canvas generator.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`${label}预览`} />
        ) : (
          <span>正在生成…</span>
        )}
      </div>
    </article>
  );
}
