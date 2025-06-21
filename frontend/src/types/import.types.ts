export interface ImportSource {
  id: number;
  name: string;
  type: 'wordpress_xml' | 'wordpress_api' | 'csv' | 'json';
  description?: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: number;
  name: string;
  source: ImportSource;
  target_site: number;
  target_site_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_items: number;
  processed_items: number;
  imported_items: number;
  failed_items: number;
  config: Record<string, any>;
  results: Record<string, any>;
  created_by: number;
  created_by_name?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportMapping {
  id: number;
  job: number;
  source_field: string;
  target_field: string;
  field_type: string;
  transform_rules: Record<string, any>;
  is_required: boolean;
  default_value?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportLog {
  id: number;
  job: number;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  details: Record<string, any>;
  created_at: string;
}

export interface CreateImportJobData {
  name: string;
  source_id: number;
  target_site: number;
  config: ImportConfig;
}

export interface ImportConfig {
  import_posts: boolean;
  import_pages: boolean;
  import_categories: boolean;
  import_tags: boolean;
  import_users: boolean;
  import_media: boolean;
  update_existing: boolean;
  skip_duplicates: boolean;
  batch_size: number;
}

export interface WordPressImportData {
  name: string;
  target_site: number;
  file?: File;
  api_url?: string;
  api_username?: string;
  api_password?: string;
  config: ImportConfig;
}

export interface WordPressPreviewData {
  site_info: {
    title: string;
    description: string;
  };
  content_counts: {
    categories: number;
    tags: number;
    posts: number;
    pages: number;
    total_items: number;
  };
  sample_posts: Array<{
    title: string;
    author: string;
    date: string;
  }>;
}

export interface ImportStats {
  job_id: number;
  name: string;
  status: string;
  progress: number;
  total_items: number;
  processed_items: number;
  imported_items: number;
  failed_items: number;
  progress_percentage: number;
  success_rate: number;
  results: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export interface ImportJobListItem {
  id: number;
  name: string;
  status: string;
  progress: number;
  target_site_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ImportSourceListItem {
  id: number;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
} 