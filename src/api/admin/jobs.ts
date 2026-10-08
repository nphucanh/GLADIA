// Quản trị tin tuyển dụng. Chỉ admin.
import type { JobIcon } from '../../types';
import { db, deleteById, unwrap } from '../client';
import { ensure } from '../validate';
import type { JobRow } from '../rows';

const ICONS: JobIcon[] = ['building', 'megaphone', 'engineer', 'support', 'legal', 'finance'];

export interface JobInput {
  title: string;
  location: string;
  employment_type?: string; // mặc định "Toàn thời gian"
  summary: string;
  icon?: JobIcon;
  is_open?: boolean;
  sort_order?: number;
}

export function validateJob(j: Partial<JobInput>, creating: boolean) {
  ensure([
    [(!creating && j.title === undefined) || (j.title ?? '').trim().length >= 3, 'Tên vị trí tối thiểu 3 ký tự.'],
    [(!creating && j.location === undefined) || (j.location ?? '').trim().length > 0, 'Vui lòng nhập nơi làm việc.'],
    [j.icon === undefined || ICONS.includes(j.icon), 'Biểu tượng không hợp lệ.'],
  ]);
}

/** Tất cả vị trí (kể cả đã đóng), theo thứ tự hiển thị. */
export async function listJobs(): Promise<JobRow[]> {
  return unwrap<JobRow[]>(await db().from('jobs').select('*').order('sort_order').order('id'));
}

export async function createJob(input: JobInput): Promise<JobRow> {
  validateJob(input, true);
  return unwrap<JobRow>(await db().from('jobs').insert(input).select().single());
}

export async function updateJob(id: number, patch: Partial<JobInput>): Promise<JobRow> {
  validateJob(patch, false);
  return unwrap<JobRow>(await db().from('jobs').update(patch).eq('id', id).select().single());
}

/** Xoá vị trí; hồ sơ đã nộp vẫn giữ (job_id → null, tên vị trí lưu sẵn trong hồ sơ). */
export async function deleteJob(id: number) {
  await deleteById('jobs', id, 'vị trí');
}

/** Sắp xếp lại theo thứ tự id truyền vào. */
export async function reorderJobs(ids: number[]) {
  await Promise.all(ids.map((id, i) => db().from('jobs').update({ sort_order: i }).eq('id', id).then(unwrap)));
}
