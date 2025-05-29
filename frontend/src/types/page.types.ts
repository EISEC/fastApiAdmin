export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: PageStatus;
  visibility: PageVisibility;
  author: number;
  author_name: string;
  site: number;
  site_name: string;
  parent?: number;
  parent_title?: string;
  template?: string;
  is_homepage: boolean;
  menu_order: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface PageCreateData {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image?: File | string;
  status: PageStatus;
  visibility: PageVisibility;
  site: number;
  parent?: number;
  template?: string;
  is_homepage?: boolean;
  menu_order?: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface PageUpdateData {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image?: File | string;
  status?: PageStatus;
  visibility?: PageVisibility;
  site?: number;
  parent?: number;
  template?: string;
  is_homepage?: boolean;
  menu_order?: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  status: PageStatus;
  author_name: string;
  site_name: string;
  parent_title?: string;
  is_homepage: boolean;
  menu_order: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface PageHierarchy {
  id: number;
  title: string;
  slug: string;
  children: PageHierarchy[];
  menu_order: number;
}

export type PageStatus = 'draft' | 'published' | 'private';
export type PageVisibility = 'public' | 'private' | 'password';

export interface PagesState {
  pages: PageListItem[];
  currentPage: Page | null;
  hierarchy: PageHierarchy[];
  isLoading: boolean;
  error: string | null;
}

export interface PagesStore extends PagesState {
  fetchPages: (siteId?: number) => Promise<void>;
  fetchPage: (id: number) => Promise<void>;
  createPage: (data: PageCreateData) => Promise<void>;
  updatePage: (id: number, data: PageUpdateData) => Promise<void>;
  deletePage: (id: number) => Promise<void>;
  duplicatePage: (id: number) => Promise<void>;
  changeStatus: (id: number, status: PageStatus) => Promise<void>;
  setHomepage: (id: number) => Promise<void>;
  updateMenuOrder: (pages: { id: number; menu_order: number }[]) => Promise<void>;
  fetchHierarchy: (siteId?: number) => Promise<void>;
  clearError: () => void;
  setCurrentPage: (page: Page | null) => void;
} 