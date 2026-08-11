import { NewsItem } from '../data/mockNews';
import { fmtNewsDate } from '../utils/format';
import { Card } from './ui/card';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'featured' | 'compact';
}

// Bố cục biên tập (ảnh + ngày tháng), không có khung/viền — dùng Card chỉ làm wrapper ngữ nghĩa,
// tắt hết background/border mặc định của Card để giữ nguyên giao diện hiện có.
const CARD_RESET = 'border-0 bg-transparent block';

export default function NewsCard({ item, variant = 'compact' }: NewsCardProps) {
  const { day, monthYear } = fmtNewsDate(item.date);
  const dateBlock = (
    <div className="news-date">
      <span className="day">{day}</span>
      <span className="my">{monthYear}</span>
    </div>
  );

  if (variant === 'featured') {
    return (
      <Card className={`news-hero ${CARD_RESET}`}>
        <div className="news-thumb">
          <img src={item.image} alt={item.title} />
        </div>
        <div className="news-hero-body">
          {dateBlock}
          <h3>{item.title}</h3>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`news-item-sm ${CARD_RESET}`}>
      <div className="news-thumb">
        <img src={item.image} alt={item.title} />
      </div>
      <div className="news-date-row">
        {dateBlock}
        <h4>{item.title}</h4>
      </div>
    </Card>
  );
}
