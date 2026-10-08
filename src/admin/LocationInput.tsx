// Ô nhập tỉnh / thành có gợi ý: mở ra là danh sách 34 tỉnh / thành, gõ từ khoá (không dấu, tên tỉnh cũ, viết tắt)
// thì lọc và xếp kết quả khớp nhất lên đầu. Vẫn cho nhập tự do (giữ được giá trị cũ ngoài danh sách).
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { fold, PROVINCES, searchProvinces } from './provinces';

/** Tô đậm phần khớp từ khoá (so sánh không dấu, từng ký tự tương ứng 1–1 với chuỗi gốc). */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = fold(query);
  if (!q) return <>{text}</>;
  const folded = [...text].map((c) => fold(c) || ' ').join('');
  const at = folded.indexOf(q);
  if (at < 0) return <>{text}</>;
  const chars = [...text];
  return (
    <>
      {chars.slice(0, at).join('')}
      <mark>{chars.slice(at, at + q.length).join('')}</mark>
      {chars.slice(at + q.length).join('')}
    </>
  );
}

export function LocationInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  // Chưa gõ gì kể từ lúc mở → hiện cả danh sách (không lọc theo giá trị đang chọn)
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const query = typed ? value : '';
  const matches = useMemo(() => searchProvinces(query), [query]);
  const exact = PROVINCES.some((p) => p.name === value.trim());

  const show = (all: boolean) => {
    setOpen(true);
    setTyped(!all);
    const i = all ? PROVINCES.findIndex((p) => p.name === value) : 0;
    setActive(Math.max(0, i));
  };
  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setTyped(false);
  };

  // Giữ mục đang chọn trong vùng nhìn thấy khi di chuyển bằng phím
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return show(!typed);
      const n = matches.length;
      if (n) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      if (matches[active]) pick(matches[active].province.name);
      else setOpen(false);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab' && open && typed && matches[0] && value.trim()) {
      // Rời ô khi đang gõ dở → chọn kết quả khớp nhất
      pick(matches[active]?.province.name ?? matches[0].province.name);
    }
  }

  return (
    <div className="a-combo">
      <MapPin size={16} className="a-combo-pin" />
      <input
        id={id}
        className={`a-input${invalid ? ' invalid' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Gõ để tìm, vd. Hà Nội, hcm, Bình Dương…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setTyped(true);
          setActive(0);
        }}
        onFocus={() => show(true)}
        onClick={() => !open && show(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="a-combo-toggle"
        tabIndex={-1}
        aria-label="Mở danh sách tỉnh / thành"
        onMouseDown={(e) => {
          e.preventDefault(); // giữ focus ở ô nhập
          if (open) setOpen(false);
          else {
            (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus();
            show(true);
          }
        }}
      >
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="a-combo-menu">
          {matches.length > 0 ? (
            <ul id={listId} role="listbox" ref={listRef} className="a-combo-list">
              {matches.map(({ province: p, via }, i) => {
                const selected = p.name === value.trim();
                return (
                  <li
                    key={p.name}
                    id={`${listId}-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={selected}
                    className={`a-combo-item${i === active ? ' active' : ''}${selected ? ' selected' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => setActive(i)}
                    onClick={() => pick(p.name)}
                  >
                    <span className="a-combo-main">
                      <b>
                        <Highlight text={p.name} query={query} />
                      </b>
                      <small>
                        {p.city ? 'Thành phố' : 'Tỉnh'}
                        {p.merged && (
                          <>
                            {' · gồm '}
                            {via ? (
                              <>
                                <Highlight text={via} query={query} /> (cũ)
                              </>
                            ) : (
                              `${p.merged.join(', ')} (cũ)`
                            )}
                          </>
                        )}
                      </small>
                    </span>
                    {selected && <Check size={15} strokeWidth={2.4} className="a-combo-check" />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="a-combo-empty">
              Không có tỉnh / thành nào khớp “{value.trim()}”. Giá trị bạn gõ vẫn được giữ nguyên.
            </p>
          )}
          {!typed && !exact && value.trim() && (
            <p className="a-combo-note">“{value.trim()}” không có trong danh sách 34 tỉnh / thành mới.</p>
          )}
        </div>
      )}
    </div>
  );
}
