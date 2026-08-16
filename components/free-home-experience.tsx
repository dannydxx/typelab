"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FREE_STORAGE_KEYS } from "@/lib/config";

export function FreeHomeExperience() {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => setHasProgress(Boolean(localStorage.getItem(FREE_STORAGE_KEYS.progress))), []);

  function startFresh() {
    localStorage.removeItem(FREE_STORAGE_KEYS.progress);
    localStorage.removeItem(FREE_STORAGE_KEYS.lastResult);
    router.push("/free/test");
  }

  return (
    <main className="app-shell free-landing page-padding">
      <div className="free-brand">
        <span className="free-brand-xhs">小红书</span>
        <Image className="free-brand-wordmark" src="/brand/typelab-wordmark.png" alt="TypeLab 类型志" width={112} height={26} />
      </div>
      <section className="free-hero">
        <div className="free-archive-mark" aria-hidden="true"><span>免费体验</span><strong>08</strong></div>
        <p className="eyebrow">一分钟人格速写</p>
        <h1>恋爱人格<br />快速体验</h1>
        <p className="hero-line">8个关系瞬间，<br />捕捉你心动之后的初步倾向。</p>
        <div className="hero-facts"><span>8道精选题</span><span>16种人格</span><span>约1分钟</span></div>
        <button className="primary-button" onClick={() => hasProgress ? router.push("/free/test") : startFresh()}>{hasProgress ? "继续免费测试" : "免费开始测试"}</button>
        {hasProgress && <button className="text-button free-reset" onClick={startFresh}>重新开始8题体验</button>}
      </section>
      <footer className="free-landing-footer">
        <span>无需注册</span><span>不收集个人信息</span><span>初步结果免费</span>
      </footer>
    </main>
  );
}
