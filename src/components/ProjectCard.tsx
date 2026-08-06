import { Project } from '../types';
import { bgByBuilding, fmtDate, fmtNumber, lotCode } from '../utils/format';
import BuildingIllustration from './BuildingIllustration';

interface ProjectCardProps {
  project: Project;
  onDetail: (project: Project) => void;
}

export default function ProjectCard({ project, onDetail }: ProjectCardProps) {
  return (
    <div className="card blueprint">
      <div className="thumb" style={{ background: bgByBuilding[project.building] }}>
        <span className="badge">{project.status}</span>
        <span className="lot">{lotCode(project.id)}</span>
        <BuildingIllustration type={project.building} />
      </div>
      <div className="body">
        <div className="loc">{project.location}</div>
        <h3>{project.name}</h3>
        <div className="meta">
          <span>{project.type}</span>
          <span>·</span>
          <span>{fmtNumber(project.interest)} lượt quan tâm</span>
        </div>
        <div className="meta" style={{ color: '#8f886f' }}>
          Cập nhật {fmtDate(project.date)}
        </div>
        <div className="price">
          <span>{project.price.toFixed(1)} tỷ VNĐ</span>
          <button type="button" onClick={() => onDetail(project)}>
            Xem chi tiết →
          </button>
        </div>
      </div>
    </div>
  );
}
