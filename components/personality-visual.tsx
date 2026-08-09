"use client";

import { useState } from "react";
import Image from "next/image";
import type { Personality } from "@/lib/types";

export function PersonalityVisual({ personality, className = "" }: { personality: Personality; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`visual-frame ${className}`} style={{
      "--visual-primary": personality.primaryColor,
      "--visual-secondary": personality.secondaryColor,
      "--visual-dark": personality.darkColor,
    } as React.CSSProperties}>
      {!failed && <Image src={personality.image} alt={`${personality.name}人格视觉`} fill sizes="(max-width: 480px) 100vw, 480px" unoptimized onError={() => setFailed(true)} />}
      {failed && (
        <div className="visual-fallback" role="img" aria-label={`${personality.name}艺术视觉占位`}>
          <span className="visual-index">{personality.id}</span>
          <span className="visual-symbol" aria-hidden="true">{personality.name.slice(-2, -1)}</span>
          <p className="visual-caption">{personality.visualKeywords.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
