interface HeroPhotoProps {
  image: string;
}

/**
 * Ảnh nền thật (Unsplash License — miễn phí thương mại) thay cho minh hoạ SVG trước đây.
 * Dùng chung cho hero Trang chủ và banner của các trang con.
 * Khi có ảnh render dự án thật, chỉ cần đổi URL trong src/data/images.ts.
 */
export default function HeroPhoto({ image }: HeroPhotoProps) {
  return <div className="hero-scene-photo" style={{ backgroundImage: `url(${image})` }} />;
}
