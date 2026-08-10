import Link from "next/link";
import { PRODUCT_CONFIG } from "@/lib/config";
import { getConfiguredPurchaseUrl } from "@/lib/purchase-config";

const features = [
  "20题重新校准关系坐标",
  "你的恋爱底色",
  "你的安全感机制",
  "三个恋爱雷区",
  "关系中的隐藏需求",
  "人格恋爱系统",
  "三条关系使用建议",
  "高清人格卡",
];

export function PurchaseGuide() {
  const purchaseUrl = getConfiguredPurchaseUrl(PRODUCT_CONFIG.purchaseUrl);
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
        {purchaseUrl ? <a className="primary-button free-cta" href={purchaseUrl} target="_blank" rel="noreferrer">前往购买</a> : <p className="purchase-channel"><strong>购买入口尚未配置</strong><br />已有兑换码的用户，可以返回免费结果页直接继续测试。</p>}
        <Link className="primary-button free-cta" href="/free/result#free-unlock">我已有兑换码</Link>
        <Link className="text-button free-retry" href="/free/result">返回我的初步结果</Link>
      </section>
    </main>
  );
}
