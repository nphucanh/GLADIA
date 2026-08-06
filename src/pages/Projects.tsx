import HeroPhoto from '../components/HeroPhoto';
import { PAGE_HERO_IMAGE } from '../data/images';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsContext } from '../context/ProjectsContext';
import { useProjectModal } from '../hooks/useProjectModal';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import Reveal from '../components/Reveal';
import { ProjectStatus, ProjectType } from '../types';

type SortKey = 'interest' | 'newest' | 'popular' | 'price-asc' | 'price-desc';

export default function Projects() {
  const { projects } = useProjectsContext();
  const { selected, open, close } = useProjectModal();
  const navigate = useNavigate();

  const [type, setType] = useState<ProjectType | 'all'>('all');
  const [location, setLocation] = useState('all');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState<SortKey>('interest');

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (location !== 'all' && p.location !== location) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        if (p.price < min || p.price > max) return false;
      }
      return true;
    });

    list = [...list];
    if (sort === 'interest') list.sort((a, b) => b.interest - a.interest);
    if (sort === 'newest') list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === 'popular') list.sort((a, b) => b.popular - a.popular);
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [projects, type, location, status, priceRange, sort]);

  function handleContact(projectName: string) {
    close();
    navigate('/lien-he', { state: { project: projectName } });
  }

  return (
    <main>
      <section className="page-hero page-hero-photo" style={{ padding: '64px 0' }}>
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            Danh mục
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)' }}>Toàn bộ dự án của Terra Việt</h1>
        </div>
      </section>

      <section className="wrap">
        <div className="filter-bar">
          <select value={type} onChange={(e) => setType(e.target.value as ProjectType | 'all')}>
            <option value="all">Tất cả loại hình</option>
            <option value="Căn hộ">Căn hộ</option>
            <option value="Biệt thự">Biệt thự</option>
            <option value="Đất nền">Đất nền</option>
            <option value="Shophouse">Shophouse</option>
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="all">Tất cả khu vực</option>
            <option value="TP.HCM">TP.HCM</option>
            <option value="Bình Dương">Bình Dương</option>
            <option value="Đồng Nai">Đồng Nai</option>
            <option value="Long An">Long An</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Hà Nội">Hà Nội</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')}>
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang mở bán">Đang mở bán</option>
            <option value="Sắp mở bán">Sắp mở bán</option>
            <option value="Đã bàn giao">Đã bàn giao</option>
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            <option value="all">Mọi mức giá</option>
            <option value="0-3">Dưới 3 tỷ</option>
            <option value="3-6">3 - 6 tỷ</option>
            <option value="6-10">6 - 10 tỷ</option>
            <option value="10-999">Trên 10 tỷ</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="interest">Quan tâm nhiều nhất</option>
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
          </select>
        </div>
        <p className="mono" style={{ fontSize: '.82rem', color: '#6b6558', marginBottom: 20 }}>
          {filtered.length} dự án phù hợp
        </p>
        <div className="grid-projects">
          {filtered.length === 0 && <p style={{ color: '#6b6558' }}>Không tìm thấy dự án phù hợp với bộ lọc.</p>}
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 6) * 60}>
              <ProjectCard project={p} onDetail={open} />
            </Reveal>
          ))}
        </div>
      </section>

      <ProjectModal project={selected} onClose={close} onContact={(p) => handleContact(p.name)} />
    </main>
  );
}
