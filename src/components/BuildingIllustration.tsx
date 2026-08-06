import { BuildingType } from '../types';

/** Minh hoạ SVG theo từng loại hình bất động sản — dùng thay ảnh thật để demo không phụ thuộc mạng */
export default function BuildingIllustration({ type }: { type: BuildingType }) {
  switch (type) {
    case 'villa':
      return (
        <svg viewBox="0 0 200 140">
          <rect width="200" height="140" fill="#2c5540" />
          <path d="M40 90 L100 45 L160 90 Z" fill="#a8492c" />
          <rect x="55" y="90" width="90" height="40" fill="#f1ecdd" />
          <rect x="70" y="100" width="14" height="20" fill="#1f3d2b" />
          <rect x="115" y="100" width="14" height="14" fill="#1f3d2b" />
        </svg>
      );
    case 'land':
      return (
        <svg viewBox="0 0 200 140">
          <rect width="200" height="140" fill="#b8933e" />
          <g stroke="#f1ecdd" strokeWidth={1.5} opacity={0.7}>
            <line x1="0" y1="35" x2="200" y2="35" />
            <line x1="0" y1="70" x2="200" y2="70" />
            <line x1="0" y1="105" x2="200" y2="105" />
            <line x1="50" y1="0" x2="50" y2="140" />
            <line x1="100" y1="0" x2="100" y2="140" />
            <line x1="150" y1="0" x2="150" y2="140" />
          </g>
          <circle cx="100" cy="70" r="6" fill="#1f3d2b" />
        </svg>
      );
    case 'shophouse':
      return (
        <svg viewBox="0 0 200 140">
          <rect width="200" height="140" fill="#a8492c" />
          <rect x="30" y="50" width="45" height="80" fill="#f1ecdd" />
          <rect x="80" y="50" width="45" height="80" fill="#e8e1cb" />
          <rect x="130" y="50" width="45" height="80" fill="#f1ecdd" />
          <g fill="#1f3d2b">
            <rect x="38" y="95" width="12" height="35" />
            <rect x="88" y="95" width="12" height="35" />
            <rect x="138" y="95" width="12" height="35" />
          </g>
        </svg>
      );
    case 'apartment':
    default:
      return (
        <svg viewBox="0 0 200 140">
          <rect width="200" height="140" fill="#1f3d2b" />
          <rect x="50" y="20" width="100" height="110" fill="#2c5540" />
          <g fill="#f1ecdd">
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={i}
                x={58 + (i % 4) * 22}
                y={30 + Math.floor(i / 4) * 17}
                width={12}
                height={10}
                opacity={(i * 7) % 3 === 0 ? 0.9 : 0.4}
              />
            ))}
          </g>
        </svg>
      );
  }
}
