// 34 tỉnh / thành phố của Việt Nam theo Nghị quyết 202/2025/QH15 (hiệu lực từ 01/07/2025).
// `name` là giá trị lưu vào dự án — giữ "TP.HCM", "Hà Nội", "Đà Nẵng", "Đồng Nai" khớp với bản đồ và nội dung
// vị trí có sẵn (src/data/maps, src/data/projectDetails.ts).
// `merged`: tỉnh cũ đã sáp nhập vào — gõ tên cũ (vd. "Bình Dương") vẫn tìm ra tỉnh / thành mới.
// `aliases`: cách gõ tắt thường gặp.

export interface Province {
  name: string;
  city: boolean; // thành phố trực thuộc trung ương
  merged?: string[];
  aliases?: string[];
}

export const PROVINCES: Province[] = [
  { name: 'Hà Nội', city: true, aliases: ['hn', 'ha noi', 'thu do'] },
  { name: 'TP.HCM', city: true, merged: ['Bình Dương', 'Bà Rịa – Vũng Tàu'], aliases: ['hcm', 'tphcm', 'hồ chí minh', 'sài gòn', 'sg', 'vũng tàu', 'brvt'] },
  { name: 'Hải Phòng', city: true, merged: ['Hải Dương'], aliases: ['hp'] },
  { name: 'Đà Nẵng', city: true, merged: ['Quảng Nam'], aliases: ['dn', 'hội an'] },
  { name: 'Huế', city: true, aliases: ['thừa thiên huế', 'tt huế'] },
  { name: 'Cần Thơ', city: true, merged: ['Sóc Trăng', 'Hậu Giang'], aliases: ['ct'] },
  { name: 'An Giang', city: false, merged: ['Kiên Giang'], aliases: ['phú quốc'] },
  { name: 'Bắc Ninh', city: false, merged: ['Bắc Giang'] },
  { name: 'Cà Mau', city: false, merged: ['Bạc Liêu'] },
  { name: 'Cao Bằng', city: false },
  { name: 'Đắk Lắk', city: false, merged: ['Phú Yên'], aliases: ['dak lak', 'buôn ma thuột'] },
  { name: 'Điện Biên', city: false },
  { name: 'Đồng Nai', city: false, merged: ['Bình Phước'], aliases: ['biên hòa', 'long thành'] },
  { name: 'Đồng Tháp', city: false, merged: ['Tiền Giang'] },
  { name: 'Gia Lai', city: false, merged: ['Bình Định'], aliases: ['quy nhơn'] },
  { name: 'Hà Tĩnh', city: false },
  { name: 'Hưng Yên', city: false, merged: ['Thái Bình'] },
  { name: 'Khánh Hòa', city: false, merged: ['Ninh Thuận'], aliases: ['nha trang', 'cam ranh'] },
  { name: 'Lai Châu', city: false },
  { name: 'Lâm Đồng', city: false, merged: ['Đắk Nông', 'Bình Thuận'], aliases: ['đà lạt', 'phan thiết', 'mũi né'] },
  { name: 'Lạng Sơn', city: false },
  { name: 'Lào Cai', city: false, merged: ['Yên Bái'], aliases: ['sa pa', 'sapa'] },
  { name: 'Nghệ An', city: false, aliases: ['vinh'] },
  { name: 'Ninh Bình', city: false, merged: ['Hà Nam', 'Nam Định'] },
  { name: 'Phú Thọ', city: false, merged: ['Vĩnh Phúc', 'Hòa Bình'] },
  { name: 'Quảng Ngãi', city: false, merged: ['Kon Tum'] },
  { name: 'Quảng Ninh', city: false, aliases: ['hạ long'] },
  { name: 'Quảng Trị', city: false, merged: ['Quảng Bình'] },
  { name: 'Sơn La', city: false },
  { name: 'Tây Ninh', city: false, merged: ['Long An'] },
  { name: 'Thái Nguyên', city: false, merged: ['Bắc Kạn'] },
  { name: 'Thanh Hóa', city: false },
  { name: 'Tuyên Quang', city: false, merged: ['Hà Giang'] },
  { name: 'Vĩnh Long', city: false, merged: ['Bến Tre', 'Trà Vinh'] },
];

/** Bỏ dấu, chữ thường, gộp khoảng trắng: "Đà  Nẵng" → "da nang". */
export function fold(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ProvinceMatch {
  province: Province;
  score: number;
  /** Tên tỉnh cũ khớp từ khoá (để ghi "gồm Bình Dương cũ"). */
  via?: string;
}

/** Điểm khớp của từ khoá (đã fold) với một chuỗi: khớp hẳn > đầu chuỗi > đầu một từ > chứa > khớp rải rác. */
function scoreText(q: string, text: string): number {
  const t = fold(text);
  const compact = t.replace(/ /g, '');
  if (t === q || compact === q.replace(/ /g, '')) return 100;
  if (t.startsWith(q)) return 80;
  if (t.split(' ').some((w, i, ws) => ws.slice(i).join(' ').startsWith(q))) return 65;
  if (compact.startsWith(q.replace(/ /g, ''))) return 60;
  if (t.includes(q)) return 45;
  // Chữ cái đầu của từng từ: "dn" → "Đà Nẵng", "brvt" → "Bà Rịa Vũng Tàu"
  const initials = t.split(' ').map((w) => w[0]).join('');
  if (q.length >= 2 && !q.includes(' ') && initials.startsWith(q)) return 55;
  return 0;
}

/** Tìm tỉnh / thành theo từ khoá — gõ không dấu, tên cũ, viết tắt đều được; kết quả sắp theo độ khớp. */
export function searchProvinces(query: string): ProvinceMatch[] {
  const q = fold(query);
  if (!q) return PROVINCES.map((province) => ({ province, score: 0 }));
  const out: ProvinceMatch[] = [];
  for (const province of PROVINCES) {
    let best: ProvinceMatch = { province, score: scoreText(q, province.name) };
    for (const a of province.aliases ?? []) {
      const s = scoreText(q, a) - 5; // tên chính luôn đứng trước cách gõ tắt
      if (s > best.score) best = { province, score: s };
    }
    for (const m of province.merged ?? []) {
      const s = scoreText(q, m) - 20; // khớp tên tỉnh cũ: xếp sau tỉnh / thành có tên khớp trực tiếp
      if (s > best.score) best = { province, score: s, via: m };
    }
    if (best.score > 0) out.push(best);
  }
  return out.sort((a, b) => b.score - a.score || Number(b.province.city) - Number(a.province.city) || a.province.name.localeCompare(b.province.name, 'vi'));
}
