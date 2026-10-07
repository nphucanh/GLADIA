// Cấu hình địa điểm cho dữ liệu bản đồ "Vị trí đắc địa" (chạy generate.mjs để tạo lại dữ liệu).
// Toạ độ dạng [lat, lng]. Toạ độ dự án là VỊ TRÍ MẪU (dự án trong mockProjects.ts là dữ liệu mẫu)
// — khi có địa chỉ thật, sửa toạ độ ở đây rồi chạy lại: node scripts/map-data/generate.mjs

export const PROJECT_ORIGINS = {
  1: { name: 'Terra Riverside', province: 'TP.HCM', coord: [10.8155, 106.7208] }, // ven sông Sài Gòn, Bình Thạnh
  4: { name: 'Terra Central Plaza', province: 'TP.HCM', coord: [10.7296, 106.7095] }, // Phú Mỹ Hưng, Quận 7
  10: { name: 'Lakeview Residence', province: 'TP.HCM', coord: [10.8005, 106.7452] }, // An Phú, Thủ Đức
  2: { name: 'Terra Hills Villa', province: 'Bình Dương', coord: [11.0035, 106.6800] }, // Phú Mỹ, Thủ Dầu Một
  7: { name: 'Sunrise Garden Land', province: 'Bình Dương', coord: [10.9235, 106.7020] }, // Thuận An
  5: { name: 'Emerald Riverside', province: 'Đồng Nai', coord: [10.9420, 106.8300] }, // ven sông Đồng Nai, Biên Hoà
  11: { name: 'Terra Green Valley', province: 'Đồng Nai', coord: [10.7840, 106.9530] }, // Long Thành
  3: { name: 'Golden Sand Land', province: 'Long An', coord: [10.6395, 106.4825] }, // Bến Lức
  9: { name: 'Terra Boulevard Shophouse', province: 'Long An', coord: [10.6090, 106.6690] }, // Cần Giuộc
  6: { name: 'Terra Coastal Villas', province: 'Đà Nẵng', coord: [16.0270, 108.2520] }, // Ngũ Hành Sơn, ven biển
  8: { name: 'Terra Sky Residence', province: 'Hà Nội', coord: [21.0225, 105.7690] }, // Mỹ Đình, Nam Từ Liêm
  12: { name: 'Metro Junction Land', province: 'Hà Nội', coord: [21.0480, 105.7420] }, // Nhổn, Bắc Từ Liêm
};

// Toạ độ điểm đến đã đối chiếu với OpenStreetMap (Nominatim) — tháng 10/2026.
// Điểm kết nối theo tỉnh/thành (khớp thứ tự với LOCATION_BY_PROVINCE trong src/data/projectDetails.ts)
export const DESTINATIONS = {
  'TP.HCM': [
    { place: 'Ga Metro Thảo Điền', coord: [10.8005, 106.73365] },
    { place: 'Trung tâm Quận 1', coord: [10.7765, 106.7031] },
    { place: 'Khu đô thị Thủ Thiêm', coord: [10.7745, 106.7213] },
    { place: 'Trường Quốc tế Anh BIS', coord: [10.81024, 106.73062] },
    { place: 'Bệnh viện FV', coord: [10.73243, 106.71788] },
    { place: 'Sân bay Tân Sơn Nhất', coord: [10.81798, 106.65626] },
  ],
  'Bình Dương': [
    { place: 'Quốc lộ 13', coord: [10.9800, 106.6680] },
    { place: 'AEON Mall Bình Dương', coord: [10.93252, 106.7115] },
    { place: 'Trung tâm TP. Thủ Dầu Một', coord: [10.97734, 106.65131] },
    { place: 'KCN VSIP', coord: [10.9314, 106.72505] },
    { place: 'Làng Đại học Quốc gia', coord: [10.88214, 106.78256] },
    { place: 'Trung tâm TP.HCM', coord: [10.7765, 106.7031] },
  ],
  'Đồng Nai': [
    { place: 'Cao tốc TP.HCM – Long Thành – Dầu Giây', coord: [10.8070, 106.9370] },
    { place: 'KCN Amata', coord: [10.94516, 106.89394] },
    { place: 'Trung tâm TP. Biên Hoà', coord: [10.94641, 106.81439] },
    { place: 'Bệnh viện Đa khoa Đồng Nai', coord: [10.95221, 106.86759] },
    { place: 'Sân bay quốc tế Long Thành', coord: [10.77599, 107.05352] },
    { place: 'Trung tâm TP.HCM', coord: [10.7765, 106.7031] },
  ],
  'Long An': [
    { place: 'Cao tốc TP.HCM – Trung Lương', coord: [10.6550, 106.4860] },
    { place: 'KCN Thuận Đạo', coord: [10.61949, 106.49239] },
    { place: 'Chợ Bến Lức', coord: [10.6385, 106.48062] },
    { place: 'Trung tâm TP. Tân An', coord: [10.53894, 106.40454] },
    { place: 'Trường THPT Nguyễn Hữu Thọ', coord: [10.64468, 106.48892] },
    { place: 'Phú Mỹ Hưng (Quận 7)', coord: [10.7290, 106.7210] },
  ],
  'Đà Nẵng': [
    { place: 'Biển Mỹ Khê', coord: [16.0610, 108.2470] },
    { place: 'Cầu Rồng', coord: [16.0610, 108.2270] },
    { place: 'Chợ Hàn', coord: [16.0680, 108.2240] },
    { place: 'Sân bay quốc tế Đà Nẵng', coord: [16.0560, 108.2030] },
    { place: 'Bán đảo Sơn Trà', coord: [16.1000, 108.2780] },
    { place: 'Bệnh viện Vinmec Đà Nẵng', coord: [16.03859, 108.21123] },
  ],
  'Hà Nội': [
    { place: 'Ga Metro Cầu Giấy', coord: [21.02913, 105.80357] },
    { place: 'Đường Vành đai 3', coord: [21.0400, 105.7810] },
    { place: 'Vincom Center Trần Duy Hưng', coord: [21.0060, 105.7970] },
    { place: 'Đại học Quốc gia Hà Nội', coord: [21.0380, 105.7830] },
    { place: 'Hồ Hoàn Kiếm', coord: [21.0285, 105.8522] },
    { place: 'Sân bay Nội Bài', coord: [21.2190, 105.8040] },
  ],
};

export const PROVINCE_SLUG = {
  'TP.HCM': 'hcm',
  'Bình Dương': 'binh-duong',
  'Đồng Nai': 'dong-nai',
  'Long An': 'long-an',
  'Đà Nẵng': 'da-nang',
  'Hà Nội': 'ha-noi',
};
