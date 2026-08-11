import HeroPhoto from '../components/HeroPhoto';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { PAGE_HERO_IMAGE } from '../data/images';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProjectsContext } from '../context/ProjectsContext';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';
import '../styles/contact.css';

interface LocationState {
  project?: string;
}

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
  const { projects } = useProjectsContext();
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
      name: form.name.trim().length < 2,
      phone: !/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, '')),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
      topic: form.topic === '',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('contact_submissions').insert([
          {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            project_interest: form.project || null,
            topic: form.topic,
            message: form.message.trim() || null,
          },
        ]);
        if (error) throw error;
      }
      setSuccess(true);
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      alert(`Gửi thông tin thất bại, vui lòng thử lại sau. (${(err as Error).message})`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="page-hero page-hero-photo" style={{ padding: '64px 0' }}>
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow">Liên hệ</div>
          <h1>Đăng ký tư vấn miễn phí</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 520 }}>
            Để lại thông tin, đội ngũ tư vấn của Terra Việt sẽ liên hệ trong vòng 24 giờ.
          </p>
        </div>
      </section>

      <section className="wrap">
        <div className="contact-grid">
          <div>
            <div className={`success-box ${success ? 'show' : ''}`}>
              ✓ Cảm ơn bạn! Yêu cầu tư vấn đã được ghi nhận, chúng tôi sẽ liên hệ sớm nhất.
            </div>
            <form className="contact-form blueprint" onSubmit={handleSubmit} noValidate>
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
              <div className="field">
                <Label htmlFor="cProject">Dự án quan tâm</Label>
                <Select value={form.project || undefined} onValueChange={(v) => set('project', v)}>
                  <SelectTrigger id="cProject" className="w-full">
                    <SelectValue placeholder="— Chọn dự án (không bắt buộc) —" />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectValue placeholder="— Chọn chủ đề —" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="err">Vui lòng chọn chủ đề.</div>
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
              <Button type="submit" variant="brick" className="w-full" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
              </Button>
            </form>
          </div>
          <div>
            <div className="info-card blueprint">
              <h4>Thông tin liên hệ</h4>
              <div className="info-row">
                <span className="ic">TEL</span>
                <span>Hotline: 1900 6868 (miễn phí)</span>
              </div>
              <div className="info-row">
                <span className="ic">MAIL</span>
                <span>lienhe@terraviet.vn</span>
              </div>
              <Separator className="my-4 bg-white/15" />
              <div className="info-row">
                <span className="ic">ADD</span>
                <span>Tòa nhà Terra, 88 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
              <div className="info-row">
                <span className="ic">TIME</span>
                <span>Thứ 2 – Thứ 7, 8:00 – 18:00</span>
              </div>
            </div>
            <div
              className="blueprint"
              style={{
                background: 'var(--white)',
                border: '1px solid var(--mist)',
                padding: 0,
                height: 240,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <svg viewBox="0 0 300 240" width="100%" height="100%">
                <rect width="300" height="240" fill="#e8e1cb" />
                <g stroke="#b8ad8f" strokeWidth={1}>
                  <line x1="0" y1="60" x2="300" y2="60" />
                  <line x1="0" y1="120" x2="300" y2="120" />
                  <line x1="0" y1="180" x2="300" y2="180" />
                  <line x1="75" y1="0" x2="75" y2="240" />
                  <line x1="150" y1="0" x2="150" y2="240" />
                  <line x1="225" y1="0" x2="225" y2="240" />
                </g>
                <circle cx="150" cy="120" r="8" fill="#a8492c" />
                <path d="M150 100 L150 70" stroke="#a8492c" strokeWidth={2} />
                <text x="150" y="150" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#1f3d2b">
                  88 Nguyễn Huệ, Q.1
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
