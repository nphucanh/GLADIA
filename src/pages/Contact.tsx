import { Building2, Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProjectsContext } from '../context/ProjectsContext';
import { submitContact } from '../api/public/contact';
import { isValidEmail, isValidName, isValidPhone } from '../api/validate';
import { cn } from '../lib/utils';
import '../styles/contact.css';

interface LocationState {
  project?: string;
}

const HOTLINE = '1900 6868';
const EMAIL = 'lienhe@terra.vn';
const ADDRESS = '11 Hồ Xuân Hương, Phường Xuân Hòa, TP. Hồ Chí Minh';
// Bản đồ Google Maps nhúng (không cần API key) + link chỉ đường mở ứng dụng/website Google Maps.
const MAP_QUERY = encodeURIComponent('11 Hồ Xuân Hương, Xuân Hòa, Hồ Chí Minh, Việt Nam');
const MAP_EMBED_URL = `https://maps.google.com/maps?q=${MAP_QUERY}&z=16&output=embed`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;

const TOPICS = [
  'Thông tin dự án & bảng giá',
  'Chính sách vay vốn / thanh toán',
  'Pháp lý & sổ hồng',
  'Đặt lịch xem nhà mẫu',
  'Khác',
];

interface FormState {
  name: string;
  phone: string;
  email: string;
  project: string;
  topic: string;
  message: string;
}

const EMPTY_FORM: FormState = { name: '', phone: '', email: '', project: '', topic: '', message: '' };

export default function Contact() {
  const { projects, loading: projectsLoading } = useProjectsContext();
  const location = useLocation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.project) {
      setForm((f) => ({ ...f, project: state.project! }));
    }
  }, [location.state]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, boolean>> = {
      name: !isValidName(form.name),
      phone: !isValidPhone(form.phone),
      email: !isValidEmail(form.email),
      topic: form.topic === '',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await submitContact({
        full_name: form.name,
        phone: form.phone,
        email: form.email,
        project_interest: form.project || null,
        topic: form.topic,
        message: form.message,
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      alert(`Gửi thông tin thất bại: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="contact-page-bg">
      <section className="wrap contact-page-head">
        <div className="contact-head-text">
          <div className="eyebrow">Liên hệ</div>
          <h1>Kết nối cùng Terra</h1>
          <p>Ghé văn phòng, gọi hotline hoặc để lại thông tin — đội ngũ tư vấn sẽ phản hồi trong vòng 24 giờ.</p>
        </div>
        <div className="contact-quick">
          <a className="contact-quick-btn primary" href={`tel:${HOTLINE.replace(/\s/g, '')}`}>
            <Phone size={16} />
            {HOTLINE}
          </a>
          <a className="contact-quick-btn" href={`mailto:${EMAIL}`}>
            <Mail size={16} />
            {EMAIL}
          </a>
        </div>
      </section>

      <section className="wrap contact-map-section">
        <div className="contact-map">
          <iframe
            title="Bản đồ văn phòng Terra"
            src={MAP_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="contact-office-card">
            <div className="contact-office-head">
              <span className="contact-office-badge" aria-hidden="true">
                <Building2 size={20} />
              </span>
              <div>
                <span className="contact-office-kicker">Văn phòng chính</span>
                <h2>Tòa nhà Terra</h2>
              </div>
            </div>
            <dl className="contact-office-list">
              <div>
                <dt>
                  <MapPin size={14} aria-hidden="true" />
                  Địa chỉ
                </dt>
                <dd>{ADDRESS}</dd>
              </div>
              <div>
                <dt>
                  <Clock size={14} aria-hidden="true" />
                  Giờ làm việc
                </dt>
                <dd>Thứ 2 – Thứ 7 · 8:00 – 18:00</dd>
              </div>
              <div>
                <dt>
                  <Phone size={14} aria-hidden="true" />
                  Hotline
                </dt>
                <dd>{HOTLINE} · miễn phí</dd>
              </div>
            </dl>
            <div className="contact-office-actions">
              <a className="contact-office-btn primary" href={MAP_DIRECTIONS_URL} target="_blank" rel="noreferrer">
                <Navigation size={15} />
                Chỉ đường
              </a>
              <a className="contact-office-btn" href={`tel:${HOTLINE.replace(/\s/g, '')}`}>
                <Phone size={15} />
                Gọi ngay
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap contact-form-section">
        <div className="contact-layout">
          <div className="contact-intro">
            <div className="eyebrow">Đăng ký tư vấn</div>
            <h2>Nhận tư vấn miễn phí</h2>
            <p>Chỉ mất 1 phút để gửi thông tin. Chúng tôi sẽ đồng hành cùng bạn từ lúc tìm hiểu đến khi nhận nhà.</p>
            <ol className="contact-steps">
              <li>
                <span className="contact-step-no">01</span>
                <div>
                  <h3>Gửi thông tin</h3>
                  <p>Cho chúng tôi biết dự án và vấn đề bạn quan tâm.</p>
                </div>
              </li>
              <li>
                <span className="contact-step-no">02</span>
                <div>
                  <h3>Chuyên viên gọi lại</h3>
                  <p>Tư vấn viên liên hệ trong vòng 24 giờ làm việc.</p>
                </div>
              </li>
              <li>
                <span className="contact-step-no">03</span>
                <div>
                  <h3>Tham quan nhà mẫu</h3>
                  <p>Đặt lịch xem nhà mẫu và nhận bảng giá chi tiết.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="contact-panel">
            <div className={`success-box ${success ? 'show' : ''}`} role="status">
              ✓ Cảm ơn bạn! Yêu cầu tư vấn đã được ghi nhận, chúng tôi sẽ liên hệ sớm nhất.
            </div>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="row-2">
                <div className={`field ${errors.name ? 'invalid' : ''}`}>
                  <Label htmlFor="cName">Họ và tên *</Label>
                  <Input
                    id="cName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                  <div className="err">Vui lòng nhập họ tên.</div>
                </div>
                <div className={`field ${errors.phone ? 'invalid' : ''}`}>
                  <Label htmlFor="cPhone">Số điện thoại *</Label>
                  <Input
                    id="cPhone"
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                  <div className="err">Số điện thoại không hợp lệ (9-11 số).</div>
                </div>
              </div>
              <div className={`field ${errors.email ? 'invalid' : ''}`}>
                <Label htmlFor="cEmail">Email *</Label>
                <Input
                  id="cEmail"
                  type="email"
                  placeholder="ban@email.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
                <div className="err">Email không hợp lệ.</div>
              </div>
              <div className="row-2">
                <div className="field">
                  <Label htmlFor="cProject">Dự án quan tâm</Label>
                  <Select value={form.project || undefined} onValueChange={(v) => set('project', v)}>
                    <SelectTrigger id="cProject" className="w-full">
                      <SelectValue placeholder="Chọn dự án (không bắt buộc)" />
                    </SelectTrigger>
                    <SelectContent className="contact-select-content">
                      {projectsLoading && projects.length === 0 && (
                        <SelectItem value="__loading" disabled>
                          Đang tải danh sách dự án…
                        </SelectItem>
                      )}
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.name} ({p.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={`field ${errors.topic ? 'invalid' : ''}`}>
                  <Label htmlFor="cTopic">Vấn đề cần tư vấn *</Label>
                  <Select value={form.topic || undefined} onValueChange={(v) => set('topic', v)}>
                    <SelectTrigger id="cTopic" className={cn('w-full', errors.topic && 'border-(--color-red)')}>
                      <SelectValue placeholder="Chọn chủ đề" />
                    </SelectTrigger>
                    <SelectContent className="contact-select-content">
                      {TOPICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="err">Vui lòng chọn chủ đề.</div>
                </div>
              </div>
              <div className="field">
                <Label htmlFor="cMsg">Nội dung chi tiết</Label>
                <Textarea
                  id="cMsg"
                  placeholder="Mô tả thêm về nhu cầu của bạn..."
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                />
              </div>
              <Button type="submit" className="contact-submit" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
