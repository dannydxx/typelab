export function DevPreviewBanner() {
  return (
    <div className="dev-preview-banner" role="status">
      <span className="dev-preview-banner-full">VISUAL QA / DEV PREVIEW · 不写入数据库，不产生正式结果</span>
      <span className="dev-preview-banner-compact">DEV / VISUAL QA · 仅预览</span>
    </div>
  );
}
