export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: PostStatus;
  visibility: PostVisibility;
  author: number;
  author_name: string;
  site: number;
  site_name: string;
  categories: Category[];
  tags: Tag[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  published_at?: string;
  views_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostCreateData {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image?: File | string;
  status: PostStatus;
  visibility: PostVisibility;
  site: number;
  categories?: number[];
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  published_at?: string;
}

export interface PostUpdateData {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image?: File | string;
  status?: PostStatus;
  visibility?: PostVisibility;
  site?: number;
  categories?: number[];
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  published_at?: string;
}

export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  status: PostStatus;
  visibility?: PostVisibility;
  author_name: string;
  site_name: string;
  categories?: Category[];
  tags?: Tag[];
  comments_count?: number;
  published_at?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  site: number;
  posts_count: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
  created_at: string;
}

export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type PostVisibility = 'public' | 'private' | 'password';

export interface PostsState {
  posts: PostListItem[];
  currentPost: Post | null;
  categories: Category[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

export interface PostsStore extends PostsState {
  fetchPosts: (siteId?: number) => Promise<void>;
  fetchPost: (id: number) => Promise<void>;
  createPost: (data: PostCreateData) => Promise<void>;
  updatePost: (id: number, data: PostUpdateData) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  duplicatePost: (id: number) => Promise<void>;
  changeStatus: (id: number, status: PostStatus) => Promise<void>;
  fetchCategories: (siteId?: number) => Promise<void>;
  fetchTags: (siteId?: number) => Promise<void>;
  clearError: () => void;
  setCurrentPost: (post: Post | null) => void;
} 