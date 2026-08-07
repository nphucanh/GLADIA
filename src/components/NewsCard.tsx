import { NewsItem } from '../data/mockNews';
import { fmtNewsDate } from '../utils/format';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'featured' | 'compact';
}

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
      <article className="news-hero">
        <div className="news-thumb">
          <img src={item.image} alt={item.title} />
        </div>
        <div className="news-hero-body">
          {dateBlock}
          <h3>{item.title}</h3>
        </div>
      </article>
    );
  }

  return (
    <article className="news-item-sm">
      <div className="news-thumb">
        <img src={item.image} alt={item.title} />
      </div>
      <div className="news-date-row">
        {dateBlock}
        <h4>{item.title}</h4>
      </div>
    </article>
  );
}
