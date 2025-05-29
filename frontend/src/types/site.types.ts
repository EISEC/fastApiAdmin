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
} 