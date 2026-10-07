import { lazy, Suspense, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Bath, BedDouble, Footprints, Maximize2, Navigation } from 'lucide-react';
import Reveal from './Reveal';
import FloorPlanDrawing from './FloorPlanDrawing';
import LocationMap from './LocationMap';
import type { Project } from '../types';
import {
  AMENITY_CATEGORY_LABEL,
  getAmenities,
  getLocationHighlight,
  type Amenity,
  type AmenityCategory,
  type FloorPlanSet,
} from '../data/projectDetails';

/** Mục "Vị trí đắc địa": đoạn giới thiệu + danh sách kết nối (thời gian di chuyển) | bản đồ. */
export function ProjectLocation({ project }: { project: Project }) {
  // useMemo: giữ nguyên mảng connections giữa các lần render để bản đồ không phải tính lại
  const { intro, connections, origin } = useMemo(() => getLocationHighlight(project), [project]);
  // Liên kết hai chiều danh sách ↔ bản đồ: điểm đang chọn (bấm ở bên nào cũng được, bấm lại để
  // bỏ chọn) và điểm đang rê chuột — cả hai bên cùng sáng theo.
  const [selected, setSelected] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // Chọn từ bản đồ → cuộn mục tương ứng trong danh sách vào tầm nhìn (trên điện thoại danh sách
  // nằm phía trên bản đồ)
  function selectFromMap(i: number) {
    setSelected(i);
    if (i >= 0) listRef.current?.children[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <section className="project-section project-location" aria-labelledby="project-location-title">
      <div className="sec-head">
        <div>
          <div className="eyebrow">Vị trí đắc địa</div>
          <h2 id="project-location-title">Kết nối thuận tiện mọi hướng</h2>
        </div>
      </div>
      <div className="project-location-layout">
        <div>
          <p className="project-section-intro">{intro}</p>
          <ul className="project-location-list" ref={listRef}>
            {connections.map(({ icon: Icon, place, minutes, km, mapsUrl }, i) => (
              <Reveal
                as="li"
                key={place}
                delay={i * 60}
                className={`${i === selected ? 'is-active' : ''}${i === hovered ? ' is-hovered' : ''}`}
              >
                <button
                  type="button"
                  className="project-location-btn"
                  aria-pressed={i === selected}
                  onClick={() => setSelected((s) => (s === i ? -1 : i))}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(-1)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(-1)}
                >
                  <span className="project-location-ic" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="project-location-place">{place}</span>
                  <span className="project-location-time">
                    <strong>{minutes}</strong> phút{km !== undefined && <> · {km} km</>}
                  </span>
                </button>
                {mapsUrl && (
                  <a
                    className="project-location-dir"
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Chỉ đường trên Google Maps"
                    aria-label={`Chỉ đường tới ${place} trên Google Maps`}
                  >
                    <Navigation size={14} aria-hidden="true" />
                  </a>
                )}
              </Reveal>
            ))}
          </ul>
          {origin && (
            <p className="project-location-note">
              * Thời gian lái xe ước tính theo tuyến đường thực tế, chưa tính ùn tắc giờ cao điểm.
            </p>
          )}
        </div>
        {origin && (
          <LocationMap
            projectName={project.name}
            locationName={project.location}
            origin={origin}
            connections={connections}
            selected={selected}
            hovered={hovered}
            onSelect={selectFromMap}
            onHover={setHovered}
          />
        )}
      </div>
    </section>
  );
}

/** Mục "Tiện ích": lưới thẻ icon + tên + mô tả ngắn. */
// Loại schema.org theo loại hình — dùng cho dữ liệu có cấu trúc (JSON-LD) của mục Tiện ích
const SCHEMA_TYPE_BY_BUILDING: Record<Project['building'], string> = {
  apartment: 'ApartmentComplex',
  villa: 'GatedResidenceCommunity',
  land: 'Residence',
  shophouse: 'Place',
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Mục "Tiện ích" — phong cách cổ điển kiểu tạp chí: tiêu đề căn giữa + hoạ tiết, dải số liệu kẻ
 *  viền đôi, ảnh điểm nhấn đóng khung viền vàng (trái) và danh mục tiện ích đánh số La Mã (phải).
 *  SEO: tiêu đề/đoạn mở đầu chứa tên dự án + khu vực, danh sách ngữ nghĩa ol/li + h3, ảnh có alt
 *  mô tả, JSON-LD schema.org (amenityFeature). Bộ lọc chỉ ẩn bằng CSS — mọi tiện ích luôn có
 *  trong DOM để được lập chỉ mục. */
export function ProjectAmenities({ project }: { project: Project }) {
  const { amenities, stats, total, intro, featureImage } = useMemo(() => getAmenities(project), [project]);
  const [filter, setFilter] = useState<AmenityCategory | 'all'>('all');
  // Mục đang chọn — khung ảnh bên cạnh hiển thị ảnh + chú thích của mục này (mặc định mục đầu)
  const [active, setActive] = useState(0);
  const frameRef = useRef<HTMLElement>(null);
  const current = amenities[active] ?? amenities[0];

  const categories = (Object.keys(AMENITY_CATEGORY_LABEL) as AmenityCategory[])
    .map((c) => ({ id: c, count: amenities.filter((a) => a.category === c).length }))
    .filter((c) => c.count > 0);
  const shown = (a: Amenity) => filter === 'all' || a.category === filter;

  function choose(i: number) {
    setActive(i);
    // Màn hình hẹp: khung ảnh nằm trên danh sách — nếu đang khuất thì cuộn tới để thấy ảnh đổi
    const frame = frameRef.current;
    if (frame && window.matchMedia('(max-width: 960px)').matches) {
      const r = frame.getBoundingClientRect();
      if (r.bottom < 80 || r.top > window.innerHeight) frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function changeFilter(next: AmenityCategory | 'all') {
    setFilter(next);
    // Mục đang chọn bị lọc mất → chuyển sang mục đầu tiên còn hiển thị
    if (next !== 'all' && amenities[active]?.category !== next) {
      setActive(Math.max(0, amenities.findIndex((a) => a.category === next)));
    }
  }

  const jsonLd = useMemo(() => {
    const data = {
      '@context': 'https://schema.org',
      '@type': SCHEMA_TYPE_BY_BUILDING[project.building],
      name: project.name,
      description: intro,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      image: typeof window !== 'undefined' ? new URL(featureImage, window.location.origin).href : undefined,
      address: { '@type': 'PostalAddress', addressRegion: project.location, addressCountry: 'VN' },
      amenityFeature: amenities.map((a) => ({
        '@type': 'LocationFeatureSpecification',
        name: a.title,
        description: a.description,
        value: true,
      })),
    };
    // Chặn chuỗi "</script>" trong nội dung làm vỡ thẻ script
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }, [project, amenities, intro, featureImage]);

  return (
    <section className="project-section project-amenities" aria-labelledby="project-amenities-title">
      <header className="project-am-head">
        <div className="eyebrow">Tiện ích nội khu</div>
        <h2 id="project-amenities-title">Tiện ích {project.name}</h2>
        <div className="project-am-ornament" aria-hidden="true">
          <span />✦<span />
        </div>
        <p className="project-am-intro">{intro}</p>
      </header>

      <Reveal>
        <dl className="project-am-stats">
          <div className="project-am-stat">
            <dt>Hạng mục tiện ích</dt>
            <dd>{total}</dd>
          </div>
          {stats.map((s) => (
            <div key={s.label} className="project-am-stat">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div className="project-am-layout">
        <Reveal variant="left" className="project-am-frame-wrap">
          <figure className="project-am-frame" ref={frameRef} aria-live="polite">
            <div className="project-am-frame-img">
              {/* key đổi theo mục → ảnh mới mờ dần hiện lên */}
              <img
                key={`${active}-${current.photo}`}
                src={current.photo}
                alt={`${current.title} — tiện ích nội khu dự án ${project.name}, ${project.location}`}
                loading="lazy"
              />
              <span className="project-am-frame-no" aria-hidden="true">
                {ROMAN[active] ?? active + 1}
              </span>
            </div>
            <figcaption key={active}>
              <span className="project-am-frame-label">
                {active === 0 ? 'Điểm nhấn' : AMENITY_CATEGORY_LABEL[current.category]}
              </span>
              <em>{current.title}</em>
              <span className="project-am-frame-desc">{current.description}</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="project-am-index">
          {/* Bộ lọc nhóm: khung chia ô kẻ viền mảnh kiểu mục lục — tên nhóm in nghiêng + số tiện ích */}
          <div
            className="project-am-seg"
            role="group"
            aria-label="Lọc tiện ích theo nhóm"
            style={{ '--seg-n': categories.length + 1 } as CSSProperties}
          >
            {[{ id: 'all' as const, count: amenities.length }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                className={`project-am-seg-btn${filter === c.id ? ' active' : ''}`}
                aria-pressed={filter === c.id}
                onClick={() => changeFilter(c.id)}
              >
                <span className="project-am-seg-name">{c.id === 'all' ? 'Tất cả' : AMENITY_CATEGORY_LABEL[c.id]}</span>
                <span className="project-am-seg-count">{String(c.count).padStart(2, '0')} tiện ích</span>
              </button>
            ))}
          </div>

          <ol className="project-am-list">
            {amenities.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal
                  as="li"
                  key={a.title}
                  delay={(i % 4) * 60}
                  className={`project-am-item${shown(a) ? '' : ' is-hidden'}${i === active ? ' is-active' : ''}`}
                >
                  <div
                    className="project-am-row"
                    role="button"
                    tabIndex={0}
                    aria-pressed={i === active}
                    onClick={() => choose(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        choose(i);
                      }
                    }}
                  >
                    <span className="project-am-numeral" aria-hidden="true">
                      {ROMAN[i] ?? i + 1}
                    </span>
                    <div className="project-am-body">
                      <div className="project-am-title-row">
                        <h3>{a.title}</h3>
                        <span className="project-am-leader" aria-hidden="true" />
                        <span className="project-am-cat">{AMENITY_CATEGORY_LABEL[a.category]}</span>
                      </div>
                      <p>{a.description}</p>
                    </div>
                    <span className="project-am-glyph" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.4} />
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </section>
  );
}

/** Mục "Mặt bằng": tab theo loại căn/tầng, mỗi tab gồm thông số + bản vẽ blueprint (SVG). */
// Tham quan 3D dựng từ ảnh không gian sống, nối phòng theo bản vẽ — chỉ tải khi bấm nút
const PhotoTour3D = lazy(() => import('./house/PhotoTour3D'));

/** `planSet`: bộ mặt bằng của dự án (useFloorPlanSet — từ Supabase hoặc bộ mẫu theo loại hình). */
export function ProjectFloorPlans({ project, planSet }: { project: Project; planSet: FloorPlanSet }) {
  const { title, intro, plans } = planSet;
  const [activeId, setActiveId] = useState(plans[0].id);
  const [tour, setTour] = useState(false);
  const plan = plans.find((p) => p.id === activeId) ?? plans[0];

  return (
    <section className="project-section project-floorplans" aria-labelledby="project-floorplans-title">
      <div className="sec-head">
        <div>
          <div className="eyebrow">Mặt bằng</div>
          <h2 id="project-floorplans-title">{title}</h2>
        </div>
      </div>
      <p className="project-section-intro">{intro}</p>

      <div className="project-fp-tabs" role="tablist" aria-label="Chọn mặt bằng">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === plan.id}
            className={`project-fp-tab${p.id === plan.id ? ' active' : ''}`}
            onClick={() => setActiveId(p.id)}
          >
            <span className="project-fp-tab-code">{p.code}</span>
            {p.name}
          </button>
        ))}
      </div>

      <div className="project-fp-layout" role="tabpanel">
        <div className="project-fp-info">
          <div className="project-fp-code">{plan.code}</div>
          <h3>{plan.name}</h3>
          <p>{plan.note}</p>
          <dl className="project-fp-specs">
            <div>
              <dt>
                <Maximize2 size={14} aria-hidden="true" />
                Diện tích
              </dt>
              <dd>{plan.area} m²</dd>
            </div>
            <div>
              <dt>Kích thước</dt>
              <dd>
                {plan.width} × {plan.depth} m
              </dd>
            </div>
            {plan.bedrooms !== undefined && (
              <div>
                <dt>
                  <BedDouble size={14} aria-hidden="true" />
                  Phòng ngủ
                </dt>
                <dd>{plan.bedrooms}</dd>
              </div>
            )}
            {plan.bathrooms !== undefined && (
              <div>
                <dt>
                  <Bath size={14} aria-hidden="true" />
                  Phòng tắm
                </dt>
                <dd>{plan.bathrooms}</dd>
              </div>
            )}
          </dl>
          {project.gallery && project.gallery.length > 0 && (
            <button type="button" className="project-fp-tour" onClick={() => setTour(true)}>
              <Footprints size={17} aria-hidden="true" />
              Tham quan 3D {plan.code}
            </button>
          )}
          <p className="project-fp-disclaimer">
            * Bản vẽ mang tính minh hoạ, diện tích thực tế theo hợp đồng mua bán.
          </p>
        </div>
        <figure className="project-fp-drawing" key={plan.id}>
          <FloorPlanDrawing plan={plan} />
          <figcaption>
            Bản vẽ mặt bằng {plan.code} · Tỉ lệ minh hoạ
          </figcaption>
        </figure>
      </div>
      {tour && project.gallery && (
        <Suspense fallback={<div className="hw3d hw3d-boot">Đang dựng không gian 3D…</div>}>
          <PhotoTour3D
            projectName={project.name}
            planSet={planSet}
            gallery={project.gallery}
            startPlanId={plan.id}
            onClose={() => setTour(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
