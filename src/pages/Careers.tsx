import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import StatCounter from '../components/StatCounter';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useActiveSection, type RailItem } from '../context/ActiveSectionContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { supabase } from '../lib/supabaseClient';
import { PAGE_HERO_IMAGE } from '../data/images';
import '../styles/resource-pages.css';

const CARD_RESET = 'border-0 bg-transparent block';

// Sidebar nhỏ (rail bên trái) của trang — 3 mục tương ứng 3 section chính, đăng ký qua
// ActiveSectionContext giống cách About.tsx làm, nhưng "chuyển slide" ở đây chỉ là cuộn mượt
// tới section (trang này không dùng cơ chế trình chiếu toàn màn hình như Trang chủ/Giới thiệu).
const CAREER_RAIL_ITEMS: RailItem[] = [
  { to: '/tuyen-dung', label: 'Giới thiệu', slide: 'career-intro' },
  { to: '/tuyen-dung', label: 'Vì sao chọn Terra Việt', slide: 'career-why' },
  { to: '/tuyen-dung', label: 'Vị trí đang tuyển', slide: 'career-jobs' },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const CAREER_STATS = [
  { target: 15, label: 'Năm kinh nghiệm' },
  { target: 500, label: 'Nhân sự toàn hệ thống' },
  { target: 48, label: 'Dự án đã & đang triển khai' },
  { target: 9, label: 'Tỉnh thành hiện diện' },
];

const BENEFITS = [
  {
    title: 'Thu nhập cạnh tranh',
    body: 'Lương cứng hấp dẫn cộng thưởng theo hiệu quả kinh doanh, xét tăng lương định kỳ 2 lần/năm.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.3c0 3.2-6 1.5-6 4.6 0 1.4 1.3 2.4 3 2.4s3-1 3-2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Lộ trình thăng tiến rõ ràng',
    body: 'Cơ hội phát triển lên các vị trí quản lý trong 2–3 năm, đồng hành cùng đà mở rộng của công ty.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 20V14M10 20V9M16 20V12M22 20V4" strokeLinecap="round" />
        <path d="M15 7l7-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Đào tạo chuyên sâu',
    body: 'Chương trình đào tạo nội bộ, kỹ năng bán hàng và quản lý dự án được cập nhật thường xuyên.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 8l9-4 9 4-9 4-9-4Z" strokeLinejoin="round" />
        <path d="M7 10v5c0 1.4 2.2 3 5 3s5-1.6 5-3v-5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Bảo hiểm & phúc lợi',
    body: 'BHXH, BHYT đầy đủ cùng gói bảo hiểm sức khoẻ cao cấp dành cho nhân viên chính thức.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Du lịch & team building',
    body: 'Company trip hằng năm cùng các hoạt động gắn kết đội nhóm được tổ chức đều đặn theo quý.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" strokeLinejoin="round" />
        <circle cx="12" cy="9.5" r="2.4" />
      </svg>
    ),
  },
  {
    title: 'Môi trường trẻ trung',
    body: 'Văn phòng hiện đại, đồng nghiệp năng động, văn hoá cởi mở và luôn tôn trọng sự sáng tạo.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="3" />
        <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <circle cx="17" cy="7" r="2.4" />
        <path d="M15.5 13.3c2.6.4 4.5 2.6 4.5 5.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

const JOBS = [
  {
    title: 'Chuyên viên Kinh doanh Bất động sản',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Tư vấn, giới thiệu sản phẩm và chăm sóc khách hàng cho các dự án đang mở bán của Terra Việt.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 21V9l9-6 9 6v12" strokeLinejoin="round" />
        <path d="M9 21v-8h6v8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Trưởng phòng Marketing',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Xây dựng chiến lược thương hiệu, truyền thông đa kênh cho danh mục dự án của công ty.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 11l18-7-7 18-2-8-9-3Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Kỹ sư Giám sát công trình',
    location: 'Bình Dương',
    employment: 'Toàn thời gian',
    body: 'Giám sát chất lượng, tiến độ thi công thực tế tại công trường theo đúng hồ sơ thiết kế.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14 3l7 7-9 9-7-7 9-9Z" strokeLinejoin="round" />
        <path d="M4 20l3-3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Chuyên viên Chăm sóc khách hàng',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Hỗ trợ, giải đáp và đồng hành cùng cư dân trong suốt quá trình sử dụng dịch vụ tại dự án.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Chuyên viên Pháp lý dự án',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Soát xét hồ sơ pháp lý, hỗ trợ thủ tục cấp phép và sổ hồng cho các dự án đang triển khai.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 3h9l5 5v13H6V3Z" strokeLinejoin="round" />
        <path d="M15 3v5h5" strokeLinejoin="round" />
        <path d="M9 12h6M9 16h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Kế toán tổng hợp',
    location: 'Đồng Nai',
    employment: 'Toàn thời gian',
    body: 'Ghi nhận, đối soát chứng từ kế toán và lập báo cáo tài chính định kỳ cho khu vực phụ trách.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const JOBS_PER_PAGE = 3;

interface ApplyFormState {
  name: string;
  phone: string;
  email: string;
  position: string;
  cv: string;
  message: string;
}

const EMPTY_APPLY_FORM: ApplyFormState = { name: '', phone: '', email: '', position: '', cv: '', message: '' };

export default function Careers() {
  useDocumentTitle('Tuyển dụng — Terra Việt');

  const { setActiveSection, registerGoToSlide, registerRailItems } = useActiveSection();

  // Đăng ký bộ mục rail riêng của trang này, và hàm "chuyển slide" (thực chất là cuộn mượt
  // tới section) để Sidebar — component riêng, không phải con của Careers — điều khiển được.
  useEffect(() => {
    registerRailItems(CAREER_RAIL_ITEMS);
    return () => registerRailItems(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerRailItems]);

  useEffect(() => {
    registerGoToSlide(scrollToSection);
    return () => registerGoToSlide(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerGoToSlide]);

  // Scroll-spy: mục sáng trong rail đi theo section đang ở gần đầu khung nhìn khi cuộn tay,
  // không chỉ khi bấm rail — dùng dải quan sát mỏng ngay dưới header cố định.
  useEffect(() => {
    const ids = CAREER_RAIL_ITEMS.map((r) => r.slide);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setActiveSection(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phân trang riêng cho section "Vị trí đang tuyển" — độc lập với cuộn trang chính, giữ
  // nguyên vị trí cuộn hiện tại khi đổi trang (chỉ crossfade nội dung, không cuộn).
  const [jobPage, setJobPage] = useState(1);
  const [jobPageTransitioning, setJobPageTransitioning] = useState(false);
  const jobTotalPages = Math.max(1, Math.ceil(JOBS.length / JOBS_PER_PAGE));
  const jobSafePage = Math.min(jobPage, jobTotalPages);
  const jobPageItems = JOBS.slice((jobSafePage - 1) * JOBS_PER_PAGE, jobSafePage * JOBS_PER_PAGE);

  function goToJobPage(p: number) {
    if (p === jobSafePage || jobPageTransitioning) return;
    setJobPageTransitioning(true);
    window.setTimeout(() => {
      setJobPage(p);
      setJobPageTransitioning(false);
    }, 200);
  }

  const [applyForm, setApplyForm] = useState<ApplyFormState>(EMPTY_APPLY_FORM);
  const [applyErrors, setApplyErrors] = useState<Partial<Record<'name' | 'phone' | 'email', boolean>>>({});
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  function setApplyField<K extends keyof ApplyFormState>(key: K, value: string) {
    setApplyForm((f) => ({ ...f, [key]: value }));
  }

  function handleApplyClick(jobTitle: string) {
    setApplyForm((f) => ({ ...f, position: jobTitle }));
    scrollToSection('career-apply');
  }

  async function handleApplySubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = {
      name: applyForm.name.trim().length < 2,
      phone: !/^[0-9]{9,11}$/.test(applyForm.phone.replace(/\s/g, '')),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email.trim()),
    };
    setApplyErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setApplySubmitting(true);
    try {
      if (supabase) {
        const composedMessage = [
          applyForm.cv.trim() ? `CV/Portfolio: ${applyForm.cv.trim()}` : null,
          applyForm.message.trim() || null,
        ]
          .filter(Boolean)
          .join('\n\n');
        const { error } = await supabase.from('contact_submissions').insert([
          {
            full_name: applyForm.name.trim(),
            phone: applyForm.phone.trim(),
            email: applyForm.email.trim(),
            project_interest: null,
            topic: `Ứng tuyển: ${applyForm.position || 'Vị trí khác'}`,
            message: composedMessage || null,
          },
        ]);
        if (error) throw error;
      }
      setApplySuccess(true);
      setApplyForm(EMPTY_APPLY_FORM);
      setApplyErrors({});
      setTimeout(() => setApplySuccess(false), 6000);
    } catch (err) {
      alert(`Gửi hồ sơ thất bại, vui lòng thử lại sau. (${(err as Error).message})`);
    } finally {
      setApplySubmitting(false);
    }
  }

  return (
    <main>
      <section className="page-hero page-hero-photo">
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow">Tuyển dụng</div>
          <h1>Cùng kiến tạo không gian sống thật.</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 560 }}>
            Terra Việt luôn tìm kiếm những cộng sự tận tâm, sẵn sàng phát triển sự nghiệp lâu dài cùng chúng tôi.
          </p>
        </div>
      </section>

      <section id="career-intro">
        <div className="wrap intro-layout">
          <Reveal variant="left">
            <div className="eyebrow">Giới thiệu</div>
            <h2>Làm việc tại Terra Việt</h2>
            <p>
              Terra Việt là nơi những con người tận tâm, giàu năng lượng cùng nhau kiến tạo những không gian sống
              thật — không chỉ cho khách hàng, mà cho chính đội ngũ của mình.
            </p>
            <p>
              Chúng tôi tin một doanh nghiệp phát triển bền vững bắt đầu từ việc trao cho nhân viên môi trường để
              học hỏi, cống hiến và trưởng thành mỗi ngày.
            </p>
            <Button variant="gold" onClick={() => scrollToSection('career-jobs')}>
              Xem vị trí đang tuyển
              <ArrowRight size={16} />
            </Button>
          </Reveal>
          <div className="career-stats">
            {CAREER_STATS.map((s, i) => (
              <Reveal key={s.label} variant="pop" delay={i * 100}>
                <div className="career-stat blueprint">
                  <StatCounter target={s.target} label={s.label} delay={150} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="career-why">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Vì sao chọn Terra Việt</div>
              <h2>Phúc lợi & môi trường làm việc</h2>
            </div>
            <p>Chúng tôi đầu tư vào con người như đầu tư vào chính các dự án — bền vững và lâu dài.</p>
          </div>
          <div className="benefit-grid">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 60}>
                <Card className={`benefit-card blueprint ${CARD_RESET}`}>
                  <div className="ic">{b.icon}</div>
                  <h3>{b.title}</h3>
                  <p>{b.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="career-jobs">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Vị trí đang tuyển</div>
              <h2>Cơ hội nghề nghiệp tại Terra Việt</h2>
            </div>
            <p>Chọn "Ứng tuyển" ở vị trí phù hợp, thông tin sẽ tự điền sẵn vào form bên dưới.</p>
          </div>
          <div className={`job-list page-fade${jobPageTransitioning ? ' is-leaving' : ''}`}>
            {jobPageItems.map((j, i) => (
              <Reveal key={j.title} delay={i * 60}>
                <Card className={`job-panel blueprint ${CARD_RESET}`}>
                  <div className="job-panel-icon">{j.icon}</div>
                  <div className="job-panel-body">
                    <div className="job-panel-top">
                      <h3>{j.title}</h3>
                      <div className="job-panel-tags">
                        <span className="job-tag">{j.location}</span>
                        <span className="job-tag">{j.employment}</span>
                      </div>
                    </div>
                    <p>{j.body}</p>
                  </div>
                  <Button variant="gold" className="job-panel-cta shrink-0" onClick={() => handleApplyClick(j.title)}>
                    Ứng tuyển
                    <ArrowRight size={16} className="job-panel-cta-arrow" />
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>

          {jobTotalPages > 1 && (
            <nav className="job-pagination" aria-label="Phân trang vị trí tuyển dụng">
              <button
                type="button"
                className="job-page-btn job-page-nav"
                disabled={jobSafePage === 1}
                onClick={() => goToJobPage(jobSafePage - 1)}
                aria-label="Trang trước"
              >
                ‹
              </button>
              {Array.from({ length: jobTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`job-page-btn${p === jobSafePage ? ' active' : ''}`}
                  aria-current={p === jobSafePage ? 'page' : undefined}
                  onClick={() => goToJobPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="job-page-btn job-page-nav"
                disabled={jobSafePage === jobTotalPages}
                onClick={() => goToJobPage(jobSafePage + 1)}
                aria-label="Trang sau"
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </section>

      <section id="career-apply">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Ứng tuyển</div>
              <h2>Gửi hồ sơ ứng tuyển</h2>
            </div>
            <p>Chưa tìm thấy vị trí phù hợp? Vẫn cứ gửi CV — chúng tôi sẽ liên hệ ngay khi có cơ hội phù hợp.</p>
          </div>
          <div className="apply-layout">
            <div>
              <div className={`apply-success ${applySuccess ? 'show' : ''}`}>
                ✓ Cảm ơn bạn! Hồ sơ ứng tuyển đã được ghi nhận, đội ngũ nhân sự sẽ sớm liên hệ.
              </div>
              <form className="apply-form blueprint" onSubmit={handleApplySubmit} noValidate>
                <div className="apply-row-2">
                  <div className={`apply-field ${applyErrors.name ? 'invalid' : ''}`}>
                    <Label className="apply-label" htmlFor="aName">
                      Họ và tên *
                    </Label>
                    <Input
                      id="aName"
                      className="apply-input"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={applyForm.name}
                      onChange={(e) => setApplyField('name', e.target.value)}
                    />
                    <div className="apply-err">Vui lòng nhập họ tên.</div>
                  </div>
                  <div className={`apply-field ${applyErrors.phone ? 'invalid' : ''}`}>
                    <Label className="apply-label" htmlFor="aPhone">
                      Số điện thoại *
                    </Label>
                    <Input
                      id="aPhone"
                      className="apply-input"
                      type="tel"
                      placeholder="09xx xxx xxx"
                      value={applyForm.phone}
                      onChange={(e) => setApplyField('phone', e.target.value)}
                    />
                    <div className="apply-err">Số điện thoại không hợp lệ (9–11 số).</div>
                  </div>
                </div>
                <div className={`apply-field ${applyErrors.email ? 'invalid' : ''}`}>
                  <Label className="apply-label" htmlFor="aEmail">
                    Email *
                  </Label>
                  <Input
                    id="aEmail"
                    className="apply-input"
                    type="email"
                    placeholder="ban@email.com"
                    value={applyForm.email}
                    onChange={(e) => setApplyField('email', e.target.value)}
                  />
                  <div className="apply-err">Email không hợp lệ.</div>
                </div>
                <div className="apply-field">
                  <Label className="apply-label" htmlFor="aPosition">
                    Vị trí ứng tuyển
                  </Label>
                  <Select value={applyForm.position || undefined} onValueChange={(v) => setApplyField('position', v)}>
                    <SelectTrigger id="aPosition" className="apply-select-trigger">
                      <SelectValue placeholder="— Chọn vị trí —" />
                    </SelectTrigger>
                    <SelectContent className="apply-select-content">
                      {JOBS.map((j) => (
                        <SelectItem key={j.title} value={j.title}>
                          {j.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="Vị trí khác">Vị trí khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="apply-field">
                  <Label className="apply-label" htmlFor="aCv">
                    Link CV / Portfolio
                  </Label>
                  <Input
                    id="aCv"
                    className="apply-input"
                    type="text"
                    placeholder="Google Drive, LinkedIn..."
                    value={applyForm.cv}
                    onChange={(e) => setApplyField('cv', e.target.value)}
                  />
                </div>
                <div className="apply-field">
                  <Label className="apply-label" htmlFor="aMsg">
                    Lời nhắn
                  </Label>
                  <Textarea
                    id="aMsg"
                    className="apply-input"
                    placeholder="Chia sẻ thêm về bản thân, kinh nghiệm của bạn..."
                    value={applyForm.message}
                    onChange={(e) => setApplyField('message', e.target.value)}
                  />
                </div>
                <Button type="submit" variant="gold" className="apply-submit" disabled={applySubmitting}>
                  {applySubmitting ? 'Đang gửi...' : 'Gửi hồ sơ ứng tuyển'}
                  <ArrowRight size={16} />
                </Button>
              </form>
            </div>

            <div className="apply-side blueprint">
              <h4>Vì sao nên ứng tuyển ngay?</h4>
              <ul>
                <li>
                  <ArrowRight size={16} />
                  Phản hồi hồ sơ trong 3–5 ngày làm việc.
                </li>
                <li>
                  <ArrowRight size={16} />
                  Phỏng vấn trực tiếp cùng quản lý bộ phận, không qua nhiều vòng trung gian.
                </li>
                <li>
                  <ArrowRight size={16} />
                  Lộ trình onboarding rõ ràng ngay từ tuần làm việc đầu tiên.
                </li>
              </ul>
              <div className="apply-side-contact">
                <span>Hoặc liên hệ trực tiếp phòng Nhân sự</span>
                <a href="tel:19006868">Hotline: 1900 6868</a>
                <a href="mailto:tuyendung@terraviet.vn">tuyendung@terraviet.vn</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
