import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Save, Trash2 } from 'lucide-react';
import { admin, type NewsInput } from '../../api/admin';
import type { NewsRow } from '../../api/rows';
import type { NewsCategory } from '../../data/mockNews';
import { mockNews } from '../../data/mockNews';
import { NEWS_FEATURED_IMAGE } from '../../data/images';
import { ADMIN_BASE } from '../AdminApp';
import { NEWS_CATEGORY_LABEL } from '../meta';
import { ErrorBox, Field, ImageField, Loading, PageHeader, Select, Switch, today, useAction, useAsync, useFeedback } from '../ui';

// Nội dung soạn trong một ô: các đoạn cách nhau bằng một dòng trống
const joinParagraphs = (p: string[]) => p.join('\n\n');
const splitParagraphs = (s: string) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

interface Draft {
  category: NewsCategory;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string;
  is_featured: boolean;
  is_published: boolean;
}

const fromRow = (n: NewsRow): Draft => ({
  category: n.category,
  title: n.title,
  body: joinParagraphs(n.content),
  image_url: n.image_url,
  published_at: n.published_at,
  is_featured: n.is_featured,
  is_published: n.is_published,
});

const blank = (): Draft => ({
  category: 'du-an',
  title: '',
  body: '',
  image_url: null,
  published_at: today(),
  is_featured: false,
  is_published: true,
});

export default function NewsEdit() {
  const { id } = useParams();
  const item = useAsync(() => (id ? admin.news.getNews(Number(id)) : Promise.resolve(null)), [id]);
  if (item.error)
    return (
      <>
        <PageHeader title="Bài viết" back={{ to: `${ADMIN_BASE}/tin-tuc`, label: 'Tin tức' }} />
        <div className="a-card">
          <ErrorBox message={item.error} onRetry={item.reload} />
        </div>
      </>
    );
  if (item.data === undefined) return <Loading />;
  return <Editor key={item.data?.id ?? 'new'} row={item.data} />;
}

function Editor({ row }: { row: NewsRow | null }) {
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const { run, runOk, busy } = useAction();
  const [initial, setInitial] = useState(() => (row ? fromRow(row) : blank()));
  const [d, setD] = useState(initial);
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const paragraphs = splitParagraphs(d.body);
  const words = d.body.trim() ? d.body.trim().split(/\s+/).length : 0;
  const errors = {
    title: d.title.trim().length < 5 ? 'Tiêu đề tối thiểu 5 ký tự.' : null,
    body: paragraphs.length === 0 ? 'Bài viết cần có nội dung.' : null,
  };
  const scheduled = d.is_published && d.published_at > today();
  const fallbackImage = row ? mockNews.find((n) => n.id === row.id)?.image ?? NEWS_FEATURED_IMAGE : undefined;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  async function save() {
    setTouched(true);
    if (errors.title || errors.body) return;
    const input: NewsInput = {
      category: d.category,
      title: d.title.trim(),
      content: paragraphs,
      image_url: d.image_url,
      published_at: d.published_at,
      is_featured: d.is_featured,
      is_published: d.is_published,
    };
    const saved = await run(
      () => (row ? admin.news.updateNews(row.id, input) : admin.news.createNews(input)),
      row ? 'Đã lưu bài viết' : 'Đã tạo bài viết',
    );
    if (!saved) return;
    setInitial(fromRow(saved));
    setD(fromRow(saved));
    if (!row) navigate(`${ADMIN_BASE}/tin-tuc/${saved.id}`, { replace: true });
  }

  async function remove() {
    if (!row) return;
    const ok = await confirm({ title: 'Xoá bài viết?', message: `"${row.title}" sẽ bị xoá vĩnh viễn.`, confirmLabel: 'Xoá bài', danger: true });
    if (ok && (await runOk(() => admin.news.deleteNews(row.id), 'Đã xoá bài viết'))) navigate(`${ADMIN_BASE}/tin-tuc`);
  }

  return (
    <div className="a-form-page">
      <PageHeader
        title={row ? 'Sửa bài viết' : 'Bài viết mới'}
        back={{ to: `${ADMIN_BASE}/tin-tuc`, label: 'Tin tức' }}
        actions={
          row && (
            <a className="a-btn a-btn--secondary a-btn--sm" href={`/tin-tuc/${row.id}`} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Xem trên website
            </a>
          )
        }
      />
      <div className="a-card">
        <div className="a-card-body a-form">
          <Field label="Tiêu đề" required error={touched ? errors.title : null} htmlFor="n-title">
            <input
              id="n-title"
              className={`a-input${touched && errors.title ? ' invalid' : ''}`}
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
              value={d.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <div className="a-grid-3">
            <Field label="Chuyên mục">
              <Select
                value={d.category}
                onChange={(v) => set('category', v)}
                options={(Object.keys(NEWS_CATEGORY_LABEL) as NewsCategory[]).map((c) => ({ value: c, label: NEWS_CATEGORY_LABEL[c] }))}
              />
            </Field>
            <Field label="Ngày đăng" hint={scheduled ? 'Bài sẽ tự hiện vào ngày này.' : 'Chọn ngày trong tương lai để hẹn giờ đăng.'}>
              <input className="a-input" type="date" value={d.published_at} onChange={(e) => set('published_at', e.target.value || today())} />
            </Field>
            <Field label="Trạng thái" hint={d.is_published ? (scheduled ? 'Hẹn giờ đăng' : 'Đang hiện trên website') : 'Lưu nháp, chưa hiện'}>
              <div className="a-switch-group">
                <Switch checked={d.is_published} onChange={(v) => set('is_published', v)} label="Xuất bản" />
                <Switch checked={d.is_featured} onChange={(v) => set('is_featured', v)} label='Gắn nhãn "Mới"' />
              </div>
            </Field>
          </div>
          <Field label="Ảnh bìa">
            <ImageField value={d.image_url} onChange={(url) => set('image_url', url)} folder="news" fallback={fallbackImage} />
          </Field>
          <Field
            label="Nội dung"
            required
            error={touched ? errors.body : null}
            hint={`${paragraphs.length} đoạn · ${words} chữ · khoảng ${Math.max(1, Math.round(words / 200))} phút đọc`}
            htmlFor="n-body"
          >
            <textarea
              id="n-body"
              className={`a-input${touched && errors.body ? ' invalid' : ''}`}
              rows={16}
              value={d.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder={'Đoạn mở đầu…\n\nĐoạn thứ hai…'}
            />
          </Field>
        </div>
        <div className="a-form-foot">
          <span className="a-hint">{dirty ? 'Có thay đổi chưa lưu' : ''}</span>
          {row && (
            <button type="button" className="a-btn a-btn--danger" disabled={busy} onClick={remove}>
              <Trash2 size={15} /> Xoá
            </button>
          )}
          <button type="button" className="a-btn a-btn--primary" disabled={busy || (!dirty && !!row)} onClick={save}>
            <Save size={15} /> {row ? 'Lưu bài viết' : d.is_published ? (scheduled ? 'Hẹn giờ đăng' : 'Đăng bài') : 'Lưu nháp'}
          </button>
        </div>
      </div>
    </div>
  );
}
