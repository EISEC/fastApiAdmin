export interface Site {
  id: number;
  name: string;
  domain: string;
  description?: string;
  owner: number;
  owner_name: string;
  assigned_users: number[];
  is_active: boolean;
  logo?: string;
  favicon?: string;
  background_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  posts_count: number;
  pages_count: number;
  authors_count: number;
  created_at: string;
  updated_at: string;
}

export interface SiteCreateData {
  name: string;
  domain: string;
  description?: string;
  logo?: File;
  favicon?: File;
  background_image?: File;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  assigned_users?: number[];
}

export interface SiteUpdateData extends Partial<SiteCreateData> {
  is_active?: boolean;
}

export interface SiteStats {
  total_sites: number;
  active_sites: number;
  inactive_sites: number;
  total_posts: number;
  total_pages: number;
  total_authors: number;
}

// 🚀 НОВЫЕ ТИПЫ для каскадного удаления
export interface SiteDeletePreview {
  site_info: {
    name: string;
    domain: string;
    owner: string;
    created_at: string;
    is_active: boolean;
  };
  to_be_deleted: {
    posts: number;
    pages: number;
    categories: number;
    tags: number;
    dynamic_models: number;
  };
  users_affected: {
    assigned_users: number;
    assigned_users_list: Array<{
      id: number;
      username: string;
      email: string;
    }>;
  };
  warnings: string[];
}

export interface SiteCascadeDeleteResult {
  message: string;
  deleted_stats: {
    posts: number;
    pages: number;
    categories: number;
    tags: number;
    dynamic_models: number;
    assigned_users_cleared: number;
  };
}

export interface SitesState {
  sites: Site[];
  currentSite: Site | null;
  isLoading: boolean;
  error: string | null;
}

export interface SitesStore extends SitesState {
  fetchSites: () => Promise<void>;
  fetchSite: (id: number) => Promise<void>;
  createSite: (data: SiteCreateData) => Promise<void>;
  updateSite: (id: number, data: SiteUpdateData) => Promise<void>;
  deleteSite: (id: number) => Promise<void>;
  assignUsers: (siteId: number, userIds: number[]) => Promise<void>;
  toggleActive: (id: number) => Promise<void>;
  getStats: () => Promise<SiteStats>;
  clearError: () => void;
  setCurrentSite: (site: Site | null) => void;
  
  // 🚀 НОВЫЕ МЕТОДЫ для каскадного удаления
  getDeletePreview: (id: number) => Promise<SiteDeletePreview>;
  cascadeDelete: (id: number) => Promise<SiteCascadeDeleteResult>;
} 