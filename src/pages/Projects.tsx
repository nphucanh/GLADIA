import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useProjectsContext } from '../context/ProjectsContext';
import ProjectCard from '../components/ProjectCard';
import Reveal from '../components/Reveal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useGridColumns } from '../hooks/useGridColumns';
import { ProjectStatus, ProjectType } from '../types';
import '../styles/projects.css';

type SortKey = 'interest' | 'newest' | 'popular' | 'price-asc' | 'price-desc';

// Số hàng đầy mỗi trang — nhân với số cột thực tế (useGridColumns) để luôn ra số item/trang
// chia hết cho số cột, không bao giờ dư 1 thẻ lẻ dòng cuối dù màn hình rộng hay hẹp.
const ROWS_PER_PAGE = 3;

export default function Projects() {
  const { projects } = useProjectsContext();
  useDocumentTitle('Dự án — Terra Việt');
  const columns = useGridColumns();
  const PAGE_SIZE = columns * ROWS_PER_PAGE;

  const [type, setType] = useState<ProjectType | 'all'>('all');
  const [location, setLocation] = useState('all');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState<SortKey>('interest');
  const [page, setPage] = useState(1);
  const [pageTransitioning, setPageTransitioning] = useState(false);

  const hasActiveFilters = type !== 'all' || location !== 'all' || status !== 'all' || priceRange !== 'all' || sort !== 'interest';

  function resetFilters() {
    setType('all');
    setLocation('all');
    setStatus('all');
    setPriceRange('all');
    setSort('interest');
  }

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

  // Bộ lọc/sắp xếp đổi, hoặc số cột (PAGE_SIZE) đổi theo bề rộng màn hình, đều quay về trang 1
  // — tránh đứng ở một số trang mà nội dung đã dịch chuyển hết sang trang khác.
  useEffect(() => setPage(1), [type, location, status, priceRange, sort, PAGE_SIZE]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goToPage(p: number) {
    if (p === safePage || pageTransitioning) return;
    setPageTransitioning(true);
    window.setTimeout(() => {
      setPage(p);
      setPageTransitioning(false);
    }, 200);
  }

  return (
    <main className="project-page-bg">
      <section className="wrap project-page-head">
        <div className="eyebrow">Danh mục</div>
        <h1>
          Toàn bộ dự án
        </h1>
      </section>

      <section className="wrap project-list-wrap">
        <div className="filter-bar">
          <Select value={type} onValueChange={(v) => setType(v as ProjectType | 'all')}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="filter-select-content">
              <SelectItem value="all">Tất cả loại hình</SelectItem>
              <SelectItem value="Căn hộ">Căn hộ</SelectItem>
              <SelectItem value="Biệt thự">Biệt thự</SelectItem>
              <SelectItem value="Đất nền">Đất nền</SelectItem>
              <SelectItem value="Shophouse">Shophouse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="filter-select-content">
              <SelectItem value="all">Tất cả khu vực</SelectItem>
              <SelectItem value="TP.HCM">TP.HCM</SelectItem>
              <SelectItem value="Bình Dương">Bình Dương</SelectItem>
              <SelectItem value="Đồng Nai">Đồng Nai</SelectItem>
              <SelectItem value="Long An">Long An</SelectItem>
              <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
              <SelectItem value="Hà Nội">Hà Nội</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | 'all')}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="filter-select-content">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Đang mở bán">Đang mở bán</SelectItem>
              <SelectItem value="Sắp mở bán">Sắp mở bán</SelectItem>
              <SelectItem value="Đã bàn giao">Đã bàn giao</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="filter-select-content">
              <SelectItem value="all">Mọi mức giá</SelectItem>
              <SelectItem value="0-3">Dưới 3 tỷ</SelectItem>
              <SelectItem value="3-6">3 - 6 tỷ</SelectItem>
              <SelectItem value="6-10">6 - 10 tỷ</SelectItem>
              <SelectItem value="10-999">Trên 10 tỷ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="filter-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="filter-select-content">
              <SelectItem value="interest">Quan tâm nhiều nhất</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="popular">Phổ biến</SelectItem>
              <SelectItem value="price-asc">Giá thấp đến cao</SelectItem>
              <SelectItem value="price-desc">Giá cao đến thấp</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button type="button" className="filter-reset-btn" onClick={resetFilters}>
              <RotateCcw size={14} />
              Xóa lọc
            </button>
          )}
        </div>
        <p className="project-result-count">{filtered.length} dự án phù hợp</p>

        <div className={`page-fade${pageTransitioning ? ' is-leaving' : ''}`}>
          {pageItems.length === 0 ? (
            <p className="project-empty">Không tìm thấy dự án phù hợp với bộ lọc.</p>
          ) : (
            <div className="grid-projects">
              {pageItems.map((p, i) => (
                <Reveal key={p.id} delay={(i % 6) * 60}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <nav className="project-pagination" aria-label="Phân trang dự án">
            <button
              type="button"
              className="project-page-btn project-page-nav"
              disabled={safePage === 1}
              onClick={() => goToPage(safePage - 1)}
              aria-label="Trang trước"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`project-page-btn${p === safePage ? ' active' : ''}`}
                aria-current={p === safePage ? 'page' : undefined}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="project-page-btn project-page-nav"
              disabled={safePage === totalPages}
              onClick={() => goToPage(safePage + 1)}
              aria-label="Trang sau"
            >
              ›
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
