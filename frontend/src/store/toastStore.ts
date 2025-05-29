import { create } from 'zustand';
import type { ToastType } from '../components/ui/Toast';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastData[];
}

interface ToastStore extends ToastState {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  // Удобные методы для разных типов
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

/**
 * Store для управления Toast уведомлениями
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Автоматическое удаление (дополнительная защита)
    setTimeout(() => {
      get().removeToast(id);
    }, (newToast.duration || 5000) + 500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Удобные методы для разных типов уведомлений
  success: (title, message, duration) => {
    get().addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  error: (title, message, duration) => {
    get().addToast({
      type: 'error',
      title,
      message,
      duration: duration || 7000, // Ошибки показываем дольше
    });
  },

  warning: (title, message, duration) => {
    get().addToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  info: (title, message, duration) => {
    get().addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  },
})); 