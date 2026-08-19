import { Link, useNavigate, useParams } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import Reveal from '../components/Reveal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';
import { useProjectsContext } from '../context/ProjectsContext';
import { PROJECT_IMAGE_BY_BUILDING } from '../data/images';
import { fmtDate, fmtNumber } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/projects.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjectsContext();
  const project = projects.find((p) => String(p.id) === id);

  useDocumentTitle(project ? `${project.name} — Terra Việt` : 'Không tìm thấy dự án — Terra Việt');

  if (!project) {
    return (
      <main className="project-page-bg">
        <section className="wrap" style={{ padding: '160px 0 120px' }}>
          <p className="project-empty">Không tìm thấy dự án này.</p>
          <Link to="/du-an" className="project-back-link">
            ← Quay lại Dự án
          </Link>
        </section>
      </main>
    );
  }

  // Dự án trước/sau — theo đúng thứ tự danh sách (mặc định), giúp người xem tiếp tục
  // duyệt mà không cần quay lại trang danh sách.
  const currentIndex = projects.findIndex((p) => p.id === project.id);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : undefined;
  const nextProject =
    currentIndex >= 0 && currentIndex < projects.length - 1 ? projects[currentIndex + 1] : undefined;

  // Dự án đề xuất — ưu tiên cùng loại hình, thiếu thì lấy thêm dự án khác cho đủ carousel.
  const sameType = projects.filter((p) => p.type === project.type && p.id !== project.id);
  const otherType = projects.filter((p) => p.type !== project.type && p.id !== project.id);
  const suggested = [...sameType, ...otherType].slice(0, 8);

  function handleContact() {
    navigate('/lien-he', { state: { project: project!.name } });
  }

  return (
    <main className="project-page-bg">
      <section className="wrap project-detail-head">
        <Link to="/du-an" className="project-back-link">
          ← Quay lại Dự án
        </Link>
        <div className="eyebrow">
          {project.location} · {project.type}
        </div>
        <h1>{project.name}</h1>
        <div className="project-detail-meta">
          <Badge variant="forest">{project.status}</Badge>
          <span className="project-updated">Cập nhật {fmtDate(project.date)}</span>
        </div>
      </section>

      <section className="wrap project-article">
        <figure className="project-detail-cover">
          <img src={PROJECT_IMAGE_BY_BUILDING[project.building]} alt={project.name} loading="lazy" />
        </figure>

        <div className="project-article-body">
          <Reveal as="p">
            {project.description ||
              `Dự án ${project.name} toạ lạc tại ${project.location}, hiện đang trong trạng thái "${project.status}". Thiết kế hướng đến không gian sống xanh, kết nối thuận tiện đến các tiện ích khu vực.`}
          </Reveal>

          <Reveal delay={80}>
            <div className="project-spec-grid">
              <div className="project-spec">
                <div className="k">Giá tham khảo</div>
                <div className="v">{project.price.toFixed(1)} tỷ VNĐ</div>
              </div>
              <div className="project-spec">
                <div className="k">Trạng thái</div>
                <div className="v">{project.status}</div>
              </div>
              <div className="project-spec">
                <div className="k">Lượt quan tâm</div>
                <div className="v">{fmtNumber(project.interest)}</div>
              </div>
              <div className="project-spec">
                <div className="k">Cập nhật</div>
                <div className="v">{fmtDate(project.date)}</div>
              </div>
            </div>
          </Reveal>

          {project.overview && (
            <Reveal delay={140}>
              <div className="project-overview">
                <h2 className="project-overview-title">Thông tin tổng quan</h2>
                <dl className="project-overview-list">
                  <div className="project-overview-row">
                    <dt>Chủ đầu tư</dt>
                    <dd>{project.overview.developer}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Quy mô dự án</dt>
                    <dd>
                      <ul>
                        {project.overview.scale.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Vị trí</dt>
                    <dd>{project.location}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Diện tích đất</dt>
                    <dd>{project.overview.landArea}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Mật độ xây dựng</dt>
                    <dd>{project.overview.buildingDensity}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Loại hình</dt>
                    <dd>{project.type}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Sở hữu</dt>
                    <dd>{project.overview.ownership}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Tiện ích</dt>
                    <dd>{project.overview.amenities}</dd>
                  </div>
                  <div className="project-overview-row">
                    <dt>Bàn giao</dt>
                    <dd>{project.overview.handover}</dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          )}

          <Button variant="brick" className="project-cta" onClick={handleContact}>
            Đăng ký tư vấn dự án này
          </Button>
        </div>

        {project.gallery && project.gallery.length > 0 && (
          <div className="project-gallery">
            <div className="sec-head">
              <div>
                <div className="eyebrow">Hình ảnh thực tế</div>
                <h2>Không gian sống tại {project.name}</h2>
              </div>
            </div>
            <div className="project-gallery-grid">
              {project.gallery.map((room, i) => (
                <Reveal key={room.room} delay={(i % 6) * 60} className="project-gallery-item">
                  <div className="project-gallery-photo">
                    <img src={room.image} alt={`${room.room} — ${project.name}`} loading="lazy" />
                  </div>
                  <h4>{room.room}</h4>
                  <p>{room.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {(prevProject || nextProject) && (
          <nav className="project-detail-nav" aria-label="Điều hướng dự án">
            {prevProject ? (
              <Link to={`/du-an/${prevProject.id}`} className="project-detail-nav-link prev">
                <span className="project-detail-nav-label">← Dự án trước</span>
                <span className="project-detail-nav-title">{prevProject.name}</span>
              </Link>
            ) : (
              <span />
            )}
            {nextProject && (
              <Link to={`/du-an/${nextProject.id}`} className="project-detail-nav-link next">
                <span className="project-detail-nav-label">Dự án sau →</span>
                <span className="project-detail-nav-title">{nextProject.name}</span>
              </Link>
            )}
          </nav>
        )}
      </section>

      {suggested.length > 0 && (
        <section className="wrap project-suggested">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Đề xuất cho bạn</div>
              <h2>Dự án khác có thể bạn quan tâm</h2>
            </div>
          </div>
          <Carousel opts={{ align: 'start', dragFree: true }} className="project-carousel px-12">
            <CarouselContent className="-ml-7">
              {suggested.map((p) => (
                <CarouselItem key={p.id} className="basis-[84%] pl-7 sm:basis-1/2 lg:basis-1/3">
                  <ProjectCard project={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1.5" />
            <CarouselNext className="right-1.5" />
          </Carousel>
        </section>
      )}
    </main>
  );
}
