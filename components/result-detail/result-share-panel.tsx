import { PRODUCT_CONFIG } from "@/lib/config";
import { getVisibleBrandAccount } from "@/lib/public-entry";
import type { PersonalityV2 } from "@/lib/types";
import { PersonalityQuote } from "./personality-quote";

export function ResultSharePanel({ share, actionMessage, retestBusy, onSave, onCopy, onRetest, onHome }: {
  share?: PersonalityV2["share"];
  actionMessage: string;
  retestBusy: boolean;
  onSave: () => void;
  onCopy: () => void;
  onRetest: () => void;
  onHome: () => void;
}) {
  const brandAccount = getVisibleBrandAccount(PRODUCT_CONFIG.xhsAccount);
  return <div className="result-share-panel">
    {share && <><h3>{share.headline}</h3><PersonalityQuote>{share.quote}</PersonalityQuote></>}
    <div className="result-actions">
      <button className="primary-button" onClick={onSave}>保存我的人格卡</button>
      <button className="secondary-button" onClick={onCopy}>复制分享文案</button>
      <button className="secondary-button" onClick={onRetest} disabled={retestBusy}>{retestBusy ? "正在准备新测试……" : "再测一次"}</button>
      <button className="text-button result-home-link" onClick={onHome}>返回完整版首页</button>
      <p className="error-text" role="status">{actionMessage}</p>
      <p className="result-note">{PRODUCT_CONFIG.brandName}{brandAccount ? ` · ${brandAccount}` : ""}<br />测试用于娱乐、自我探索及关系沟通参考，不构成心理诊断。</p>
    </div>
  </div>;
}
