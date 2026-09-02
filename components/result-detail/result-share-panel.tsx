import Image from "next/image";
import type { PersonalityV2 } from "@/lib/types";
import { PersonalityQuote } from "./personality-quote";

export function ResultSharePanel({ share, actionMessage, onSave, onCopy, onHome }: {
  share?: PersonalityV2["share"];
  actionMessage: string;
  onSave: () => void;
  onCopy: () => void;
  onHome: () => void;
}) {
  return <div className="result-share-panel">
    {share && <><h3>{share.headline}</h3><PersonalityQuote>{share.quote}</PersonalityQuote></>}
    <div className="result-actions">
      <button className="primary-button" onClick={onSave}>保存我的人格卡</button>
      <button className="secondary-button" onClick={onCopy}>复制分享文案</button>
      <button className="text-button result-home-link" onClick={onHome}>返回完整版首页</button>
      <p className="error-text" role="status">{actionMessage}</p>
      <div className="result-brand">
        <span>小红书</span>
        <Image className="result-brand-wordmark" src="/brand/typelab-wordmark.png" alt="TypeLab 类型志" width={44} height={20} />
      </div>
      <p className="result-note">测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断。</p>
    </div>
  </div>;
}
