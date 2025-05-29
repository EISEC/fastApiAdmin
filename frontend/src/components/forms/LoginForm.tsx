import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

// Схема валидации
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email адрес'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Форма входа в систему с валидацией
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormData) => {
    await login(data);
    onSuccess?.();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Вход в FastAPI Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Система управления сайтами
          </p>
        </div>
        
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <Input
              label="Email адрес"
              type="email"
              autoComplete="email"
              fullWidth
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="Пароль"
              type="password"
              autoComplete="current-password"
              fullWidth
              error={errors.password?.message}
              {...register('password')}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Запомнить меня
                </label>
              </div>
              
              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Забыли пароль?
                </a>
              </div>
            </div>
            
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              Войти
            </Button>
          </form>
        </Card>
        
        <div className="text-center">
          <span className="text-gray-600">Нет аккаунта? </span>
          <a
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Зарегистрироваться
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 