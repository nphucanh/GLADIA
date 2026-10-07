import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Footprints } from 'lucide-react';
import BackToProjects from '../components/BackToProjects';
import ProjectCard from '../components/ProjectCard';
import { ProjectAmenities, ProjectFloorPlans, ProjectLocation } from '../components/ProjectDetailSections';
import { getFloorPlans } from '../data/projectDetails';
import { useFloorPlanSet } from '../hooks/useApiData';
import { getProject } from '../api/public';
import type { Project } from '../types';
import Reveal from '../components/Reveal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';
import { useProjectsContext } from '../context/ProjectsContext';
import { PROJECT_IMAGE_BY_BUILDING } from '../data/images';
import { fmtDate, fmtNumber } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/projects.css';

// Tham quan 3D dựng từ ảnh không gian sống (three.js) — chỉ tải khi người xem bấm vào ảnh
const PhotoTour3D = lazy(() => import('../components/house/PhotoTour3D'));

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, loading } = useProjectsContext();
  // Ảnh không gian sống vừa bấm → mở tham quan 3D tại phòng tương ứng (-1 = đóng)
  const [viewer, setViewer] = useState(-1);
  const listed = projects.find((p) => String(p.id) === id);
  // Không có trong danh sách (vd. dự án vừa thêm ở trang quản trị, danh sách đang tải lại) → hỏi riêng dự án này
  // trước khi báo "không tìm thấy".
  const [single, setSingle] = useState<{ id: string; project: Project | null } | null>(null);
  useEffect(() => {
    if (listed || !id) return;
    let alive = true;
    getProject(id).then((r) => alive && setSingle({ id, project: r.data }));
    return () => {
      alive = false;
    };
  }, [listed, id]);
  const project = listed ?? (single && single.id === id ? single.project ?? undefined : undefined);
  const checking = loading || (!listed && single?.id !== id);
  const planSet = useFloorPlanSet(project);

  useDocumentTitle(project ? `${project.name} — Terra` : checking ? 'Dự án — Terra' : 'Không tìm thấy dự án — Terra');

  if (!project) {
    return (
      <main className="project-page-bg">
        <section className="wrap" style={{ paddingTop: 160, paddingBottom: 120 }}>
          <p className="project-empty">{checking ? 'Đang tải dự án…' : 'Không tìm thấy dự án này (có thể dự án đang được ẩn).'}</p>
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
        <BackToProjects />
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
          <img src={project.image ?? PROJECT_IMAGE_BY_BUILDING[project.building]} alt={project.name} loading="lazy" />
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

        <ProjectLocation project={project} />
        <ProjectAmenities project={project} />
        {planSet && planSet.plans.length > 0 && <ProjectFloorPlans key={String(project.id)} project={project} planSet={planSet} />}

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
                  <button
                    type="button"
                    className="project-gallery-photo"
                    onClick={() => setViewer(i)}
                    aria-label={`Tham quan 3D ${room.room} — ${project.name}`}
                  >
                    <img src={room.image} alt={`${room.room} — ${project.name}`} loading="lazy" />
                    <span className="project-gallery-3d" aria-hidden="true">
                      <Footprints size={15} /> Tham quan 3D
                    </span>
                  </button>
                  <h4>{room.room}</h4>
                  <p>{room.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {project.gallery && viewer >= 0 && (
          <Suspense fallback={<div className="hw3d hw3d-boot">Đang dựng không gian 3D…</div>}>
            <PhotoTour3D
              projectName={project.name}
              planSet={planSet ?? getFloorPlans(project)}
              gallery={project.gallery}
              startIndex={viewer}
              onClose={() => setViewer(-1)}
            />
          </Suspense>
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
