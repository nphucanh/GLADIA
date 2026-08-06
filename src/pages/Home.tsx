import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsContext } from '../context/ProjectsContext';
import { useProjectModal } from '../hooks/useProjectModal';
import { usePresentationScroll } from '../hooks/usePresentationScroll';
import { useActiveSection } from '../context/ActiveSectionContext';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import Reveal from '../components/Reveal';
import StatCounter from '../components/StatCounter';
import HeroPhoto from '../components/HeroPhoto';
import { HERO_IMAGE } from '../data/images';

type SortKey = 'interest' | 'newest' | 'popular';
type DateFilter = 'all' | '30' | '90' | '365';

const PARTNERS = ['VietBuild', 'Sacom Bank', 'Delta Architects', 'GreenPark JSC', 'Sunrise Materials'];

// Thứ tự slide đồng bộ với thứ tự mục trong Sidebar: Trang chủ → Giới thiệu → Dự án.
const SLIDE_IDS = ['slide-hero', 'slide-stats', 'slide-about', 'slide-partners', 'slide-featured'];

// Section nào đang cuộn tới trên Trang chủ thì mục tương ứng trong Sidebar sẽ sáng lên
const SLIDE_NAV_MAP: Record<string, string> = {
  'slide-hero': '/',
  'slide-stats': '/',
  'slide-about': '/gioi-thieu',
  'slide-partners': '/gioi-thieu',
  'slide-featured': '/du-an',
};

export default function Home() {
  const { projects } = useProjectsContext();
  const { selected, open, close } = useProjectModal();
  const navigate = useNavigate();

  // Cảm giác "từng trang toàn màn hình" kiểu PowerPoint — chỉ ở Trang chủ.
  useEffect(() => {
    document.documentElement.classList.add('home-snap');
    return () => document.documentElement.classList.remove('home-snap');
  }, []);
  // Tắt điều hướng bằng lăn chuột khi đang mở modal chi tiết dự án, để cuộn trong modal bình thường.
  usePresentationScroll(SLIDE_IDS, Boolean(selected));

  // Đồng bộ mục sáng trong Sidebar theo section đang cuộn tới trên Trang chủ.
  const { setActiveSection } = useActiveSection();
  useEffect(() => {
    const elements = SLIDE_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(SLIDE_NAV_MAP[entry.target.id] ?? '/');
          }
        });
      },
      { threshold: [0.5] },
    );
    elements.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setActiveSection(null);
    };
  }, [setActiveSection]);

  const [sort, setSort] = useState<SortKey>('interest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const featured = useMemo(() => {
    let list = [...projects];
    if (dateFilter !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateFilter, 10));
      list = list.filter((p) => new Date(p.date) >= cutoff);
    }
    if (sort === 'interest') list.sort((a, b) => b.interest - a.interest);
    if (sort === 'newest') list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'popular') list.sort((a, b) => b.popular - a.popular);
    return list.slice(0, 3);
  }, [projects, sort, dateFilter]);

  function handleContact(projectName: string) {
    close();
    navigate('/lien-he', { state: { project: projectName } });
  }

  return (
    <main>
      <section className="hero hero-photo snap-section" id="slide-hero">
        <HeroPhoto image={HERO_IMAGE} />
        <div className="hero-grid" />

        {/* Logotype khổng lồ, mờ dần — lấy cảm hứng bố cục từ thegio.vn */}
        <div className="hero-logotype" aria-hidden="true">
          <span className="hlt-small">Terra</span>
          <span className="hlt-big">VIỆT</span>
          <span className="hlt-caption">R E A L &nbsp; E S T A T E &nbsp; G R O U P</span>
        </div>

        <div className="wrap hero-inner">
          <div className="eyebrow">Terra Việt Group · Từ 2010</div>
          <h1>
            <span className="line">
              <span>Kiến tạo</span>
            </span>
            <span className="line">
              <span>không gian sống thật.</span>
            </span>
          </h1>
          <p className="lead">
            Chúng tôi phát triển các dự án bất động sản gắn với đời sống thực — nơi con người, thiên nhiên và đô thị
            cùng tồn tại hài hoà.
          </p>
          <div className="hero-actions">
            <button className="cta-btn brick" onClick={() => navigate('/du-an')}>
              Khám phá dự án
            </button>
            <button
              className="cta-btn ghost"
              style={{ color: '#fff', borderColor: '#fff' }}
              onClick={() => navigate('/lien-he')}
            >
              Đăng ký tư vấn
            </button>
          </div>
        </div>

        <button
          className="scroll-cue"
          onClick={() => document.getElementById('slide-stats')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          aria-label="Cuộn xuống phần tiếp theo"
        >
          <span className="stick" />
          <span>Cuộn</span>
        </button>
      </section>

      <div className="stats-strip snap-section slide-center" id="slide-stats">
        <div className="wrap">
          <StatCounter target={15} label="Năm kinh nghiệm" />
          <StatCounter target={48} label="Dự án đã triển khai" />
          <StatCounter target={12000} label="Khách hàng tin tưởng" />
          <StatCounter target={9} label="Tỉnh thành hiện diện" />
        </div>
      </div>

      <section className="wrap snap-section slide-center" id="slide-about" style={{ paddingTop: 0 }}>
        <Reveal>
          <div
            className="blueprint"
            style={{
              background: 'var(--white)',
              border: '1px solid var(--mist)',
              padding: 56,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 40,
              alignItems: 'center',
            }}
          >
            <div>
              <div className="eyebrow">Về Terra Việt</div>
              <h2>Hơn một chủ đầu tư — một người kiến tạo cộng đồng.</h2>
              <p style={{ color: '#5c5648' }}>
                Từ 2010, Terra Việt theo đuổi triết lý phát triển bền vững: mỗi dự án là một hệ sinh thái sống, không
                chỉ là công trình bất động sản.
              </p>
              <button className="cta-btn ghost" onClick={() => navigate('/gioi-thieu')}>
                Tìm hiểu thêm về chúng tôi
              </button>
            </div>
            <svg viewBox="0 0 300 220" width="100%">
              <rect x="0" y="0" width="300" height="220" fill="#f1ecdd" />
              <rect x="30" y="80" width="60" height="120" fill="#1f3d2b" />
              <rect x="100" y="40" width="55" height="160" fill="#2c5540" />
              <rect x="165" y="100" width="50" height="100" fill="#a8492c" />
              <rect x="225" y="60" width="45" height="140" fill="#1f3d2b" />
              <g stroke="#f1ecdd" strokeWidth={2}>
                <line x1="30" y1="100" x2="90" y2="100" />
                <line x1="30" y1="130" x2="90" y2="130" />
                <line x1="30" y1="160" x2="90" y2="160" />
                <line x1="100" y1="60" x2="155" y2="60" />
                <line x1="100" y1="90" x2="155" y2="90" />
                <line x1="100" y1="120" x2="155" y2="120" />
                <line x1="100" y1="150" x2="155" y2="150" />
              </g>
            </svg>
          </div>
        </Reveal>
      </section>

      <section className="wrap snap-section slide-center" id="slide-partners" style={{ paddingTop: 0 }}>
        <div className="eyebrow">Đối tác chiến lược</div>
        <div className="partners-strip">
          {PARTNERS.map((p) => (
            <div className="partner-tile" key={p}>
              {p}
            </div>
          ))}
        </div>
      </section>

      <section className="wrap snap-section slide-center" id="slide-featured">
        <div className="sec-head">
          <div>
            <div className="eyebrow">Danh mục dự án</div>
            <h2>Dự án đang được quan tâm</h2>
          </div>
          <p>Lọc theo mức độ quan tâm, độ phổ biến hoặc thời gian ra mắt để tìm dự án phù hợp với bạn.</p>
        </div>
        <div className="filter-bar">
          <div className="chip-group">
            {(
              [
                { key: 'interest', label: 'Quan tâm nhiều nhất' },
                { key: 'newest', label: 'Mới nhất' },
                { key: 'popular', label: 'Phổ biến' },
              ] as { key: SortKey; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                className={`chip ${sort === s.key ? 'active' : ''}`}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">Mọi thời điểm</option>
            <option value="30">30 ngày qua</option>
            <option value="90">3 tháng qua</option>
            <option value="365">1 năm qua</option>
          </select>
        </div>
        <div className="grid-projects">
          {featured.length === 0 && <p style={{ color: '#6b6558' }}>Không có dự án phù hợp trong khoảng thời gian này.</p>}
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProjectCard project={p} onDetail={open} />
            </Reveal>
          ))}
        </div>
      </section>

      <ProjectModal project={selected} onClose={close} onContact={(p) => handleContact(p.name)} />
    </main>
  );
}
