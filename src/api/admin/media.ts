// Tải ảnh lên kho công khai "media" (ảnh dự án, ảnh không gian sống, ảnh tin tức, ảnh đại diện quản trị viên). Chỉ admin.
import { ApiError, db, toApiError } from '../client';
import { MEDIA_MAX_BYTES, MEDIA_MIME_TYPES, ensure, uniqueName } from '../validate';

export type MediaFolder = 'projects' | 'gallery' | 'news' | 'avatars';

export interface UploadedMedia {
  path: string; // đường dẫn trong kho, vd "news/3f2a…-anh.jpg"
  url: string; // link công khai — lưu vào cover_image_url / image_url
}

export async function uploadMedia(file: File, folder: MediaFolder): Promise<UploadedMedia> {
  ensure([
    [file.size <= MEDIA_MAX_BYTES, 'Ảnh tối đa 10MB.'],
    [MEDIA_MIME_TYPES.includes(file.type), 'Chỉ nhận ảnh JPG, PNG, WebP hoặc AVIF.'],
  ]);
  const path = `${folder}/${uniqueName(file.name)}`;
  const bucket = db().storage.from('media');
  const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) throw toApiError(error);
  return { path, url: bucket.getPublicUrl(path).data.publicUrl };
}

/** Đường dẫn trong kho từ link công khai (null nếu link không thuộc kho media). */
export function mediaPathFromUrl(url: string) {
  const m = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Xoá ảnh khỏi kho (nhận đường dẫn hoặc link công khai). Link ngoài kho → bỏ qua. */
export async function deleteMedia(pathOrUrl: string) {
  const path = pathOrUrl.startsWith('http') ? mediaPathFromUrl(pathOrUrl) : pathOrUrl;
  if (!path) return;
  const { error } = await db().storage.from('media').remove([path]);
  if (error) throw toApiError(error);
}

export { ApiError };
