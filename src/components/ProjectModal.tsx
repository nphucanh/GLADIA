import { Project } from '../types';
import { bgByBuilding, fmtDate, fmtNumber } from '../utils/format';
import BuildingIllustration from './BuildingIllustration';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import '../styles/modal.css';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onContact: (project: Project) => void;
}

export default function ProjectModal({ project, onClose, onContact }: ProjectModalProps) {
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      {project && (
        <DialogContent showCloseButton={false}>
          {/* Bọc riêng 1 lớp cho hiệu ứng "blueprint" (góc bản vẽ) — .blueprint đặt position:relative,
              không thể gắn thẳng lên DialogContent vì sẽ đè lên position:fixed dùng để định vị modal. */}
          <div className="blueprint">
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
                height: 240,
              }}
            >
              <BuildingIllustration type={project.building} />
            </div>
            <div className="modal-body">
              <div className="eyebrow">
                {project.location} · {project.type}
              </div>
              <DialogTitle asChild>
                <h2>{project.name}</h2>
              </DialogTitle>
              <DialogDescription asChild>
                <p style={{ color: '#5c5648' }}>
                  {project.description ||
                    `Dự án ${project.name} toạ lạc tại ${project.location}, hiện đang trong trạng thái "${project.status}". Thiết kế hướng đến không gian sống xanh, kết nối thuận tiện đến các tiện ích khu vực.`}
                </p>
              </DialogDescription>
              <div className="spec-grid">
                <div className="spec">
                  <div className="k">Giá tham khảo</div>
                  <div className="v">{project.price.toFixed(1)} tỷ VNĐ</div>
                </div>
                <div className="spec">
                  <div className="k">Trạng thái</div>
                  <div className="v">
                    <Badge variant="forest">{project.status}</Badge>
                  </div>
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
              <Separator className="mb-5" />
              <Button variant="brick" className="w-full" onClick={() => onContact(project)}>
                Đăng ký tư vấn dự án này
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
