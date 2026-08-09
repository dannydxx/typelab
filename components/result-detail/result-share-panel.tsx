import { PRODUCT_CONFIG } from "@/lib/config";
import type { PersonalityV2 } from "@/lib/types";
import { PersonalityQuote } from "./personality-quote";

export function ResultSharePanel({ share, actionMessage, onSave, onCopy }: {
  share?: PersonalityV2["share"];
  actionMessage: string;
  onSave: () => void;
  onCopy: () => void;
}) {
  return <div className="result-share-panel">
    {share && <><h3>{share.headline}</h3><PersonalityQuote>{share.quote}</PersonalityQuote></>}
    <div className="result-actions">
      <button className="primary-button" onClick={onSave}>保存我的人格卡</button>
      <button className="secondary-button" onClick={onCopy}>复制分享文案</button>
      <p className="error-text" role="status">{actionMessage}</p>
      <p className="result-note">{PRODUCT_CONFIG.brandName} · {PRODUCT_CONFIG.xhsAccount}<br />测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断。</p>
    </div>
  </div>;
}
