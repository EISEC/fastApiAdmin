export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  avatar?: string;
  birth_date?: string;
  about?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  rating: number;
  accessible_sites_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: 'superuser' | 'admin' | 'author' | 'user';
  name_display: string;
  permissions: Record<string, unknown>;
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  role?: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  username: string;
  email: string;
  role: string;
  role_display: string;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// Types for users management
export interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface UsersStore extends UsersState {
  fetchUsers: () => Promise<void>;
  fetchUser: (id: number) => Promise<void>;
  clearError: () => void;
  setCurrentUser: (user: User | null) => void;
} 