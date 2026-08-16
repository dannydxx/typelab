"use client";

import { useEffect, useState } from "react";
import { PRODUCT_CONFIG } from "@/lib/config";
import { createFreeShareCard } from "@/lib/free-share-card";
import { createFreeShareText, downloadFreeShareCard, shareFreeResult } from "@/lib/free-share";
import { getPublicEntryUrl } from "@/lib/public-entry";
import type { FreePersonalityPreview } from "@/lib/types";

export function FreeSharePanel({ preview }: { preview: FreePersonalityPreview }) {
  const [card, setCard] = useState<Blob | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [message, setMessage] = useState("正在准备初步人格卡……");
  const publicUrl = getPublicEntryUrl(PRODUCT_CONFIG.siteUrl);

  useEffect(() => {
    let active = true;
    void createFreeShareCard(preview).then((blob) => {
      if (!active) return;
      setCard(blob);
      setMessage("");
    }).catch(() => {
      if (active) setMessage("人格卡暂时无法生成，你仍可复制分享文案。");
    });
    return () => { active = false; };
  }, [preview]);

  useEffect(() => () => {
    if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
  }, [generatedImageUrl]);

  function revealDownload(blob: Blob) {
    if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
    const url = downloadFreeShareCard(blob, preview.name);
    setGeneratedImageUrl(url);
    setMessage("已生成人格卡；若浏览器没有自动保存，请长按下方图片保存。");
  }

  async function handleShare() {
    if (!card) return;
    const outcome = await shareFreeResult(card, preview, publicUrl);
    if (outcome === "shared-file") setMessage("已打开图片分享面板。");
    if (outcome === "shared-link") setMessage("当前浏览器不支持图片分享，已改为分享测试链接。");
    if (outcome === "save") revealDownload(card);
    if (outcome === "cancelled") setMessage("");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(createFreeShareText(preview, publicUrl));
      setMessage("分享文案与免费测试入口已复制。");
    } catch {
      setMessage("复制失败，请长按测试入口手动复制。");
    }
  }

  return (
    <aside className="free-share-panel page-padding" aria-labelledby="free-share-title">
      <div className="free-share-heading">
        <p className="eyebrow">保存这份初步人格</p>
        <h2 id="free-share-title">把「{preview.name}」分享给朋友</h2>
        <p>这是一张免费初步人格卡，不包含完整版报告内容。</p>
      </div>
      <div className="free-share-actions">
        <button className="secondary-button" type="button" disabled={!card} onClick={() => card && revealDownload(card)}>保存初步人格卡</button>
        <button className="secondary-button free-share-button" type="button" disabled={!card} onClick={handleShare}>分享我的初步人格</button>
        <button className="text-button" type="button" onClick={handleCopy}>复制分享文案</button>
      </div>
      {message && <p className="free-share-message" role="status">{message}</p>}
      {generatedImageUrl && (
        <figure className="free-share-generated">
          {/* blob URL is generated locally from the safe free-card canvas. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={generatedImageUrl} alt={`${preview.name}初步人格分享卡`} />
          <figcaption>长按图片保存到手机</figcaption>
        </figure>
      )}
    </aside>
  );
}
