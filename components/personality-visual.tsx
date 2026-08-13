"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { PersonalityPortraitData } from "@/lib/types";
import { getPersonalityVisualAsset, getPremiumPortraitUrl } from "@/lib/personality-visual-assets";

type PersonalityVisualProps = {
  personality: PersonalityPortraitData & { previewPortrait?: string };
  mode: "free-preview" | "premium";
  className?: string;
  showStatus?: boolean;
};

export function PersonalityVisual({ personality, mode, className = "", showStatus = true }: PersonalityVisualProps) {
  const [failed, setFailed] = useState(false);
  const [previewPathname, setPreviewPathname] = useState<string | null>(null);
  const visualAsset = getPersonalityVisualAsset(personality.id);
  const waitsForDevelopmentPreview = mode === "premium"
    && process.env.NODE_ENV === "development"
    && previewPathname === null;
  const imageSource = waitsForDevelopmentPreview
    ? null
    : mode === "free-preview"
      ? personality.previewPortrait ?? visualAsset?.previewPortrait
      : getPremiumPortraitUrl(personality.id, previewPathname ?? "");

  useEffect(() => setFailed(false), [imageSource]);
  useEffect(() => {
    if (mode === "premium" && process.env.NODE_ENV === "development") {
      setPreviewPathname(window.location.pathname);
    }
  }, [mode, personality.id]);

  return (
    <figure className={`personality-portrait personality-portrait--${mode} ${className}`}>
      <div className="visual-frame" style={{
        "--visual-primary": personality.primaryColor,
        "--visual-secondary": personality.secondaryColor,
        "--visual-dark": personality.darkColor,
      } as React.CSSProperties}>
        {imageSource && !failed && <Image src={imageSource} alt={mode === "free-preview" ? `${personality.name}初步形象预览` : `${personality.name}完整人格形象`} fill sizes="(max-width: 480px) 100vw, 480px" unoptimized onError={() => setFailed(true)} />}
        {(!imageSource || failed) && (
          <div className="visual-fallback" role="img" aria-label={`${personality.name}艺术视觉占位`}>
            <span className="visual-index">{personality.id}</span>
            <span className="visual-symbol" aria-hidden="true">{personality.animal}</span>
            <p className="visual-caption">{personality.visualKeywords.join(" · ")}</p>
          </div>
        )}
        {mode === "free-preview" && <div className="portrait-preview-mask" aria-hidden="true"><i /><i /><i /></div>}
      </div>
      {showStatus && <figcaption className="portrait-status">
        <span>{mode === "free-preview" ? "初步形象预览" : "正式人格"}</span>
        <p>{mode === "free-preview" ? "完整20题后确认正式人格与完整形象" : "完整人格形象 · 正式揭晓"}</p>
      </figcaption>}
    </figure>
  );
}
