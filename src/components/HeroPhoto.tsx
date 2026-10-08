import { useEffect, useState } from 'react';
import { hideSplash } from '../lib/splash';

interface HeroPhotoProps {
  image: string;
}

// Ảnh đã tải trong phiên này — lần sau hiện ngay, không chạy lại hiệu ứng chờ
const loadedImages = new Set<string>();

/**
 * Ảnh nền thật (Unsplash License — miễn phí thương mại) thay cho minh hoạ SVG trước đây.
 * Dùng chung cho hero Trang chủ và banner của các trang con.
 * Khi có ảnh render dự án thật, chỉ cần đổi URL trong src/data/images.ts.
 *
 * Ảnh lớn tải chậm → trong lúc chờ hiện lớp ánh sáng chạy qua (để khách biết trang đang tải, không phải lỗi),
 * tải xong thì ảnh hiện dần và ẩn màn hình chờ lúc mở web.
 */
export default function HeroPhoto({ image }: HeroPhotoProps) {
  const [loaded, setLoaded] = useState(() => loadedImages.has(image));

  useEffect(() => {
    if (loadedImages.has(image)) {
      setLoaded(true);
      hideSplash();
      return;
    }
    setLoaded(false);
    let alive = true;
    const img = new Image();
    const done = () => {
      loadedImages.add(image);
      if (alive) setLoaded(true);
      hideSplash();
    };
    img.onload = done;
    img.onerror = done; // lỗi ảnh → vẫn bỏ trạng thái chờ, để lộ nền màu thay vì chờ mãi
    img.src = image;
    if (img.complete) done();
    return () => {
      alive = false;
    };
  }, [image]);

  return (
    <>
      {!loaded && <div className="hero-photo-loading" aria-hidden="true" />}
      <div className={`hero-scene-photo${loaded ? ' is-loaded' : ''}`} style={{ backgroundImage: `url(${image})` }} />
    </>
  );
}
