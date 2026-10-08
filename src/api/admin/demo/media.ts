// Xem thử › tải ảnh: thu nhỏ ảnh rồi lưu dạng data URL trong kho xem thử (localStorage).
import { ApiError } from '../../client';
import { ensure, MEDIA_MAX_BYTES, MEDIA_MIME_TYPES } from '../../validate';
import type * as MediaApi from '../media';
import { delay } from './shared';

export const mediaApi: typeof MediaApi = {
  async uploadMedia(file, folder) {
    ensure([
      [file.size <= MEDIA_MAX_BYTES, 'Ảnh tối đa 10MB.'],
      [MEDIA_MIME_TYPES.includes(file.type), 'Chỉ nhận ảnh JPG, PNG, WebP hoặc AVIF.'],
    ]);
    // Kho xem thử nằm trong localStorage (giới hạn vài MB) → thu ảnh về tối đa 1600px, lưu dạng data URL
    return delay({ path: `${folder}/${file.name}`, url: await shrinkImage(file) });
  },
  mediaPathFromUrl: () => null,
  async deleteMedia() {
    await delay(null);
  },
  ApiError,
};

async function shrinkImage(file: File, max = 1600): Promise<string> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const webp = c.toDataURL('image/webp', 0.82);
    return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.85);
  } catch {
    throw new ApiError('Không đọc được ảnh này, hãy thử ảnh khác.', 'validation');
  }
}
