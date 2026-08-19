import { Link } from 'react-router-dom';
import { Project } from '../types';
import { fmtDate, fmtNumber, lotCode } from '../utils/format';
import { PROJECT_IMAGE_BY_BUILDING } from '../data/images';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ProjectCardProps {
  project: Project;
}

// Reset background/border mặc định của Card — .project-panel tự lo phần khung/nền,
// giống cách NewsCard tắt style mặc định của Card (xem CARD_RESET ở NewsCard.tsx).
const CARD_RESET = 'border-0 bg-transparent block';

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/du-an/${project.id}`} className="project-card-link">
      <Card className={`project-panel blueprint ${CARD_RESET}`}>
        <div className="project-thumb">
          <Badge className="badge">{project.status}</Badge>
          <span className="lot">{lotCode(project.id)}</span>
          <img src={PROJECT_IMAGE_BY_BUILDING[project.building]} alt={project.name} loading="lazy" />
        </div>
        <div className="project-body">
          <div className="loc">{project.location}</div>
          <h3>{project.name}</h3>
          <div className="meta">
            <span>{project.type}</span>
            <span>·</span>
            <span>{fmtNumber(project.interest)} lượt quan tâm</span>
          </div>
          <div className="meta">Cập nhật {fmtDate(project.date)}</div>
          <div className="price">
            <span>{project.price.toFixed(1)} tỷ VNĐ</span>
            <span className="project-see-more">Xem chi tiết →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
