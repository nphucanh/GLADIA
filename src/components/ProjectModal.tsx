import { Project } from '../types';
import { bgByBuilding, fmtDate, fmtNumber } from '../utils/format';
import BuildingIllustration from './BuildingIllustration';
import '../styles/modal.css';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onContact: (project: Project) => void;
}

export default function ProjectModal({ project, onClose, onContact }: ProjectModalProps) {
  return (
    <div
      className={`modal-overlay ${project ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {project && (
        <div className="modal blueprint">
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
          <div
            className="thumb"
            style={{
              background: bgByBuilding[project.building],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BuildingIllustration type={project.building} />
          </div>
          <div className="modal-body">
            <div className="eyebrow">
              {project.location} · {project.type}
            </div>
            <h2>{project.name}</h2>
            <p style={{ color: '#5c5648' }}>
              {project.description ||
                `Dự án ${project.name} toạ lạc tại ${project.location}, hiện đang trong trạng thái "${project.status}". Thiết kế hướng đến không gian sống xanh, kết nối thuận tiện đến các tiện ích khu vực.`}
            </p>
            <div className="spec-grid">
              <div className="spec">
                <div className="k">Giá tham khảo</div>
                <div className="v">{project.price.toFixed(1)} tỷ VNĐ</div>
              </div>
              <div className="spec">
                <div className="k">Trạng thái</div>
                <div className="v">{project.status}</div>
              </div>
              <div className="spec">
                <div className="k">Lượt quan tâm</div>
                <div className="v">{fmtNumber(project.interest)}</div>
              </div>
              <div className="spec">
                <div className="k">Cập nhật</div>
                <div className="v">{fmtDate(project.date)}</div>
              </div>
            </div>
            <button
              className="cta-btn brick"
              style={{ width: '100%' }}
              onClick={() => onContact(project)}
            >
              Đăng ký tư vấn dự án này
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
