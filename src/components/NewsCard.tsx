import { Link } from 'react-router-dom';
import { NewsItem } from '../data/mockNews';
import { fmtNewsDate } from '../utils/format';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'featured' | 'compact' | 'promo';
  // Ngày dạng pill (dd-mm-yyyy) + ribbon "NEW" trên ảnh — chỉ dùng ở trang Tin tức (News.tsx),
  // mặc định tắt để không đổi giao diện teaser hiện có ở Trang chủ (Home.tsx).
  pillDate?: boolean;
  ribbon?: boolean;
  // Bo góc + nền sáng hơn một chút thành khung panel — dùng ở trang Tin tức (News.tsx).
  panel?: boolean;
}

// Bố cục biên tập (ảnh + ngày tháng), không có khung/viền — dùng Card chỉ làm wrapper ngữ nghĩa,
// tắt hết background/border mặc định của Card để giữ nguyên giao diện hiện có.
const CARD_RESET = 'border-0 bg-transparent block';

function DateTag({ item, pillDate }: { item: NewsItem; pillDate?: boolean }) {
  if (pillDate) {
    const [y, m, d] = item.date.split('-');
    return <span className="news-date-pill">{`${d}-${m}-${y}`}</span>;
  }
  const { day, monthYear } = fmtNewsDate(item.date);
  return (
    <div className="news-date">
      <span className="day">{day}</span>
      <span className="my">{monthYear}</span>
    </div>
  );
}

export default function NewsCard({ item, variant = 'compact', pillDate, ribbon, panel }: NewsCardProps) {
  const showRibbon = ribbon && item.isNew;
  const dateBlock = <DateTag item={item} pillDate={pillDate} />;
  const ribbonBadge = showRibbon ? (
    <Badge variant="gold" className="news-ribbon">
      New
    </Badge>
  ) : null;
  const panelClass = panel ? ' news-panel' : '';

  let body: JSX.Element;
  if (variant === 'featured') {
    body = (
      <Card className={`news-hero${panelClass} ${CARD_RESET}`}>
        <div className="news-thumb">
          {ribbonBadge}
          <img src={item.image} alt={item.title} />
        </div>
        <div className="news-hero-body">
          {dateBlock}
          <h3>{item.title}</h3>
        </div>
      </Card>
    );
  } else if (variant === 'promo') {
    body = (
      <Card className={`news-promo${panelClass} ${CARD_RESET}`}>
        <div className="news-thumb">
          {ribbonBadge}
          <img src={item.image} alt={item.title} />
        </div>
        <div className="news-promo-body">
          {dateBlock}
          <h3>{item.title}</h3>
        </div>
      </Card>
    );
  } else {
    body = (
      <Card className={`news-item-sm${panelClass} ${CARD_RESET}`}>
        <div className="news-thumb">
          {ribbonBadge}
          <img src={item.image} alt={item.title} />
        </div>
        <div className={pillDate ? 'news-date-col' : 'news-date-row'}>
          {dateBlock}
          <h4>{item.title}</h4>
        </div>
      </Card>
    );
  }

  return (
    <Link to={`/tin-tuc/${item.id}`} className="news-card-link">
      {body}
    </Link>
  );
}
