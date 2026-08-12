import Link from "next/link";
import { notFound } from "next/navigation";
import { DevPreviewBanner } from "@/components/dev-preview-banner";
import { HomeExperience } from "@/components/home-experience";
import { PERSONALITIES } from "@/lib/personalities";

export const dynamic = "force-dynamic";

export default function DevPremiumPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <HomeExperience devPreview />
      <aside className="dev-preview-directory page-padding">
        <DevPreviewBanner />
        <p className="eyebrow">开发验收快捷入口</p>
        <h2>直接查看16型完整结果</h2>
        <div className="dev-preview-links">
          {PERSONALITIES.map((personality) => (
            <Link href={`/dev/premium-preview/result/${personality.id}`} key={personality.id}>
              <span>TYPE {personality.id}</span>{personality.name}
            </Link>
          ))}
        </div>
        <div className="dev-preview-actions">
          <Link href="/dev/premium-preview/test">查看Premium答题页</Link>
          <Link href="/dev/share-preview">查看32张分享卡总览</Link>
        </div>
      </aside>
    </>
  );
}
