// Kiểu dữ liệu từng dòng trong database (supabase/schema.sql) + chuyển sang kiểu mà giao diện dùng (src/types.ts).
import type { BuildingType, Job, JobIcon, Project, ProjectGalleryItem, ProjectOverview, ProjectStatus, ProjectType } from '../types';
import type { FloorPlan, FloorPlanRoom, FloorPlanSet } from '../data/projectDetails';
import type { NewsCategory, NewsItem } from '../data/mockNews';
import { mockProjects } from '../data/mockProjects';
import { mockNews } from '../data/mockNews';
import { NEWS_FEATURED_IMAGE } from '../data/images';

export interface ProjectRow {
  id: number;
  name: string;
  type: ProjectType;
  location: string;
  status: ProjectStatus;
  price: number | string; // numeric → PostgREST có thể trả về chuỗi
  interest_count: number;
  popularity: number;
  building_type: BuildingType;
  description: string | null;
  overview: ProjectOverview | null;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  project_gallery?: GalleryRow[];
}

export interface GalleryRow {
  id: number;
  project_id: number;
  room: string;
  description: string;
  image_url: string;
  depth_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface FloorPlanSetRow {
  id: number;
  building_type: BuildingType | null;
  project_id: number | null;
  title: string;
  intro: string;
  updated_at: string;
  floor_plans?: FloorPlanRow[];
}

export interface FloorPlanRow {
  id: number;
  set_id: number;
  slug: string;
  name: string;
  code: string;
  area: number | string;
  bedrooms: number | null;
  bathrooms: number | null;
  note: string;
  width: number | string;
  depth: number | string;
  rooms: FloorPlanRoom[];
  sort_order: number;
}

export interface NewsRow {
  id: number;
  category: NewsCategory;
  title: string;
  content: string[];
  image_url: string | null;
  published_at: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobRow {
  id: number;
  title: string;
  location: string;
  employment_type: string;
  summary: string;
  icon: JobIcon;
  is_open: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ContactStatus = 'new' | 'in_progress' | 'done' | 'spam';

export interface ContactSubmissionRow {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  project_interest: string | null;
  topic: string;
  message: string | null;
  status: ContactStatus;
  admin_note: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'new' | 'reviewing' | 'interview' | 'hired' | 'rejected';

export interface JobApplicationRow {
  id: number;
  job_id: number | null;
  position: string;
  full_name: string;
  phone: string;
  email: string;
  cv_url: string | null;
  cv_path: string | null;
  message: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Chuyển dòng database → kiểu giao diện ----------

const sortByOrder = <T extends { sort_order: number; id: number }>(rows: T[] = []) =>
  [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

export function toGalleryItem(g: GalleryRow): ProjectGalleryItem {
  return {
    room: g.room,
    image: g.image_url,
    description: g.description,
    photo3d: g.depth_url ? { depth: g.depth_url } : undefined,
  };
}

/**
 * Dự án từ database. Ảnh không gian sống / thông tin tổng quan chưa nhập trên database thì dùng của dữ liệu
 * mẫu cùng id (ảnh mẫu đóng gói sẵn trong web, kèm dữ liệu 3D), để chuyển sang database dần dần được.
 */
export function toProject(row: ProjectRow): Project {
  const mock = mockProjects.find((p) => String(p.id) === String(row.id));
  const gallery = sortByOrder(row.project_gallery).map(toGalleryItem);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    location: row.location,
    status: row.status,
    price: Number(row.price),
    interest: row.interest_count ?? 0,
    popular: row.popularity ?? 0,
    date: (row.created_at ?? '').slice(0, 10),
    building: row.building_type ?? 'apartment',
    description: row.description ?? undefined,
    image: row.cover_image_url ?? undefined,
    gallery: gallery.length ? gallery : mock?.gallery,
    overview: row.overview ?? mock?.overview,
  };
}

export function toFloorPlan(r: FloorPlanRow): FloorPlan {
  return {
    id: r.slug,
    name: r.name,
    code: r.code,
    area: Number(r.area),
    bedrooms: r.bedrooms ?? undefined,
    bathrooms: r.bathrooms ?? undefined,
    note: r.note,
    width: Number(r.width),
    depth: Number(r.depth),
    rooms: r.rooms ?? [],
  };
}

export function toFloorPlanSet(s: FloorPlanSetRow): FloorPlanSet {
  return { title: s.title, intro: s.intro, plans: sortByOrder(s.floor_plans).map(toFloorPlan) };
}

/** Ảnh tin tức: ảnh trên database → ảnh mẫu cùng id → ảnh mặc định. */
export function toNewsItem(r: NewsRow): NewsItem {
  return {
    id: r.id,
    image: r.image_url ?? mockNews.find((n) => n.id === r.id)?.image ?? NEWS_FEATURED_IMAGE,
    date: r.published_at,
    title: r.title,
    category: r.category,
    isNew: r.is_featured || undefined,
    content: r.content ?? [],
  };
}

export function toJob(r: JobRow): Job {
  return { id: r.id, title: r.title, location: r.location, employment: r.employment_type, body: r.summary, icon: r.icon };
}
