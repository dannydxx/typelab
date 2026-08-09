import Link from "next/link";
import { PRODUCT_CONFIG } from "@/lib/config";

const features = ["20道完整测试", "16型人格精准解析", "专属AI人格卡", "完整关系分析", "高清分享海报"];

export function PurchaseGuide() {
  return (
    <main className="app-shell purchase-page page-padding">
      <header className="result-top"><p className="eyebrow">完整版恋爱人格档案</p><span className="type-number">20题</span></header>
      <section className="purchase-hero">
        <p className="eyebrow">从初步倾向到完整人格</p>
        <h1>解锁完整<br />恋爱人格档案</h1>
        <p>免费版捕捉的是一瞬间的倾向。完整版用20个关系场景重新校准四个维度，为你展开一份值得收藏的恋爱人格档案。</p>
      </section>
      <section className="purchase-features">
        {features.map((feature, index) => <div key={feature}><span>0{index + 1}</span><strong>{feature}</strong></div>)}
      </section>
      <section className="purchase-actions">
        {PRODUCT_CONFIG.purchaseUrl ? <a className="primary-button free-cta" href={PRODUCT_CONFIG.purchaseUrl} target="_blank" rel="noreferrer">前往小红书购买</a> : <p className="purchase-channel">请前往小红书搜索<br /><strong>{PRODUCT_CONFIG.xhsAccount}</strong><br />购买后将自动收到网址与专属兑换码。</p>}
        <Link className="primary-button free-cta" href="/premium">我已有兑换码，进入完整版</Link>
        <Link className="text-button free-retry" href="/free/result">返回我的初步结果</Link>
      </section>
    </main>
  );
}
