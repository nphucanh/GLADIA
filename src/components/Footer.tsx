import { FormEvent, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Footer() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const phoneOk = /^[0-9]{9,11}$/.test(phone.replace(/\s/g, ''));
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (name.trim().length < 2 || !phoneOk || !emailOk) {
      setMsg({ text: 'Vui lòng nhập đầy đủ và đúng định dạng thông tin.', tone: 'err' });
      return;
    }
    setSending(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('contact_submissions').insert([
          {
            full_name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            topic: 'Đăng ký nhận tin (footer)',
            project_interest: null,
            message: null,
          },
        ]);
        if (error) throw error;
      }
      setMsg({ text: '✓ Đã đăng ký! Chúng tôi sẽ gửi thông tin dự án mới đến bạn.', tone: 'ok' });
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setMsg({ text: `Có lỗi xảy ra, vui lòng thử lại. (${(err as Error).message})`, tone: 'err' });
    } finally {
      setSending(false);
    }
  }

  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: '#b8933e', marginBottom: 14 }}>
              <svg className="mark" viewBox="0 0 40 40" fill="none">
                <rect x="1" y="1" width="38" height="38" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 28V16L20 8L32 16V28H24V20H16V28H8Z" fill="currentColor" />
              </svg>
              TERRA VIỆT
            </div>
            <p style={{ fontSize: '.86rem', color: '#a49d89', maxWidth: 280 }}>
              Kiến tạo không gian sống chất lượng, bền vững cho cộng đồng Việt.
            </p>
          </div>
          <div>
            <h4>Điều hướng</h4>
            <NavLink to="/">Trang chủ</NavLink>
            <NavLink to="/gioi-thieu">Giới thiệu</NavLink>
            <NavLink to="/du-an">Dự án</NavLink>
            <NavLink to="/tien-ich">Tiện ích</NavLink>
            <NavLink to="/lien-he">Liên hệ</NavLink>
          </div>
          <div>
            <h4>Loại hình</h4>
            <a href="#!">Căn hộ</a>
            <a href="#!">Biệt thự</a>
            <a href="#!">Đất nền</a>
            <a href="#!">Shophouse</a>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <a href="tel:19006868">1900 6868</a>
            <a href="mailto:lienhe@terraviet.vn">lienhe@terraviet.vn</a>
            <span style={{ display: 'block', padding: '5px 0', fontSize: '.88rem', color: '#a49d89' }}>
              88 Nguyễn Huệ, Q.1, TP.HCM
            </span>
          </div>
        </div>

        <div className="newsletter-bar blueprint">
          <div>
            <h4 style={{ marginBottom: 4 }}>Đăng ký nhận tin dự án mới</h4>
            <p style={{ fontSize: '.82rem', color: '#a49d89', margin: 0 }}>
              Chỉ mất 10 giây — nhận thông tin mở bán sớm nhất.
            </p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="cta-btn brick" disabled={sending}>
              {sending ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
        </div>
        {msg && (
          <p style={{ color: msg.tone === 'ok' ? '#b8933e' : '#a8492c', fontSize: '.82rem', margin: '-30px 0 30px' }}>
            {msg.text}
          </p>
        )}

        <div className="footer-bottom">
          <span>© 2026 Terra Việt Group. Bảo lưu mọi quyền.</span>
          <span>Frontend: React + TypeScript · Backend: Supabase.</span>
        </div>
      </div>
    </footer>
  );
}
