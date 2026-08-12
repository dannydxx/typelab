export function PremiumShareSavePreview({ imageUrl, personalityName, onClose, onLoad, onError }: {
  imageUrl: string;
  personalityName: string;
  onClose: () => void;
  onLoad: () => void;
  onError: () => void;
}) {
  if (!imageUrl) return null;

  return (
    <div className="premium-share-preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="premium-share-preview-title">
      <section className="premium-share-preview">
        <header>
          <div>
            <p className="eyebrow">人格卡已生成</p>
            <h2 id="premium-share-preview-title">长按图片保存</h2>
          </div>
          <button type="button" className="premium-share-preview-close" aria-label="关闭人格卡预览" onClick={onClose}>关闭</button>
        </header>
        <figure>
          {/* This local blob URL remains alive while the long-press preview is open. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`${personalityName}完整人格分享卡`} onLoad={onLoad} onError={onError} />
          <figcaption>长按图片，选择“保存到相册”</figcaption>
        </figure>
      </section>
    </div>
  );
}
