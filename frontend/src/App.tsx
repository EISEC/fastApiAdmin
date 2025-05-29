import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useToastStore } from './store';
import ToastContainer from './components/ui/ToastContainer';
import LoginForm from './components/forms/LoginForm';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import CreateSite from './pages/CreateSite';
import EditSite from './pages/EditSite';
import Posts from './pages/Posts';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Users from './pages/Users';
import Pages from './pages/Pages';
import CreatePage from './pages/CreatePage';
import EditPage from './pages/EditPage';

/**
 * Компонент для защищенных маршрутов
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Главный компонент приложения
 */
const App: React.FC = () => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { toasts, removeToast } = useToastStore();
  
  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
  }, [checkAuth]);
  
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Публичные маршруты */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <LoginForm />
              )
            } 
          />
          
          {/* Защищенные маршруты */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Управление сайтами */}
          <Route 
            path="/sites" 
            element={
              <ProtectedRoute>
                <Sites />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sites/create" 
            element={
              <ProtectedRoute>
                <CreateSite />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sites/:id/edit" 
            element={
              <ProtectedRoute>
                <EditSite />
              </ProtectedRoute>
            } 
          />
          
          {/* Управление постами */}
          <Route 
            path="/posts" 
            element={
              <ProtectedRoute>
                <Posts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/posts/create" 
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/posts/:id/edit" 
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            } 
          />
          
          {/* Управление пользователями */}
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } 
          />
          
          {/* Управление страницами */}
          <Route 
            path="/pages" 
            element={
              <ProtectedRoute>
                <Pages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pages/create" 
            element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pages/:id/edit" 
            element={
              <ProtectedRoute>
                <EditPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Перенаправление на главную для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast уведомления */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </Router>
  );
};

export default App;
