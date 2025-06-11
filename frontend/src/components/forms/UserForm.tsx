import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUsersStore } from '../../store';
import type { User } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Icon from '../ui/Icon';

// Zod схема валидации для пользователя
const userSchema = z.object({
  username: z.string()
    .min(1, 'Имя пользователя обязательно')
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(150, 'Имя пользователя не должно превышать 150 символов'),
  email: z.string()
    .min(1, 'Email обязателен')
    .email('Введите корректный email адрес'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .or(z.literal(''))
    .optional(),
  first_name: z.string()
    .max(150, 'Имя не должно превышать 150 символов')
    .or(z.literal(''))
    .optional(),
  last_name: z.string()
    .max(150, 'Фамилия не должна превышать 150 символов')
    .or(z.literal(''))
    .optional(),
  role: z.number({
    required_error: 'Выберите роль пользователя',
    invalid_type_error: 'Выберите роль пользователя'
  }).min(1, 'Выберите роль пользователя'),
  is_active: z.boolean(),
  birth_date: z.string()
    .or(z.literal(''))
    .optional(),
  about: z.string()
    .max(1000, 'Информация о пользователе не должна превышать 1000 символов')
    .or(z.literal(''))
    .optional(),
  avatar: z.union([
    z.instanceof(File),
    z.string(),
    z.null()
  ]).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Форма для создания и редактирования пользователей
 */
const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSuccess, 
  onCancel 
}) => {
  // Используем селекторы для состояний вместо деструктуризации функций
  const isLoading = useUsersStore(state => state.isLoading);
  const roles = useUsersStore(state => state.roles || []);
  const storeError = useUsersStore(state => state.error);
  const rolesLoading = useUsersStore(state => state.rolesLoading);
  
  const isEditing = Boolean(user);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      is_active: true,
      birth_date: '',
      about: '',
      // role будет установлена после загрузки ролей
    },
    mode: 'onChange',
  });

  const watchedRole = watch('role');

  // Функция для установки роли по умолчанию
  const setDefaultRole = () => {
    if (!rolesLoading && Array.isArray(roles) && roles.length > 0 && !isEditing && !watchedRole) {
      const defaultRole = roles.find(r => r.name === 'user') || roles[0];
      setValue('role', defaultRole.id, { shouldValidate: true });
      console.log('Set default role:', defaultRole.name_display, `(id: ${defaultRole.id})`);
    }
  };

  // Функция для установки роли пользователя при редактировании
  const setUserRole = () => {
    if (user && isEditing && !rolesLoading && Array.isArray(roles) && roles.length > 0) {
      // Находим роль пользователя в списке загруженных ролей
      const userRole = roles.find(r => r.id === user.role?.id);
      if (userRole) {
        setValue('role', userRole.id, { shouldValidate: true });
        console.log('Set user role for editing:', userRole.name_display, `(id: ${userRole.id})`);
      } else {
        console.warn('User role not found in roles list:', user.role);
      }
    }
  };

  // Загружаем данные пользователя для редактирования
  useEffect(() => {
    if (user && isEditing) {
      // Заполняем все поля формы данными пользователя
      reset({
        username: user.username || '',
        email: user.email || '',
        password: '', // Пароль не показываем при редактировании
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role?.id || 0, // Временно устанавливаем, будет переустановлено после загрузки ролей
        is_active: user.is_active !== undefined ? user.is_active : true,
        birth_date: user.birth_date || '',
        about: user.about || '',
      });
      
      console.log('Form reset with user data:', {
        username: user.username,
        email: user.email,
        role: user.role?.id,
        is_active: user.is_active,
        first_name: user.first_name,
        last_name: user.last_name,
        birth_date: user.birth_date,
        about: user.about
      });
    }
  }, [user, isEditing, reset]);

  // Загружаем роли при монтировании
  useEffect(() => {
    const loadRoles = async () => {
      try {
        // Вызываем функцию напрямую из store
        await useUsersStore.getState().fetchRoles();
        console.log('Roles loaded successfully in component');
      } catch (error) {
        console.error('Failed to load roles in component:', error);
      }
    };
    
    loadRoles();
  }, []); // Пустой массив зависимостей

  // Устанавливаем роль после загрузки ролей
  useEffect(() => {
    if (!rolesLoading && Array.isArray(roles) && roles.length > 0) {
      if (isEditing && user) {
        // Для редактирования - устанавливаем роль пользователя
        setUserRole();
      } else if (!isEditing && !watchedRole) {
        // Для создания - устанавливаем роль по умолчанию
        setDefaultRole();
      }
    }
  }, [rolesLoading, roles.length, isEditing, user?.role?.id, watchedRole]); // Добавляем все необходимые зависимости

  // Очищаем ошибки при размонтировании
  useEffect(() => {
    return () => {
      // Вызываем функцию напрямую из store
      useUsersStore.getState().clearError();
    };
  }, []); // Убираем clearError из зависимостей

  const onSubmit = async (data: UserFormData) => {
    try {
      // Вызываем функцию напрямую из store
      useUsersStore.getState().clearError();
      
      if (isEditing && user) {
        const updateData: any = {
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: data.is_active,
          birth_date: data.birth_date,
          about: data.about,
        };
        
        // Добавляем пароль только если он введен
        if (data.password && data.password.trim()) {
          updateData.password = data.password;
        }
        
        // Добавляем аватар только если он выбран
        if (data.avatar instanceof File) {
          updateData.avatar = data.avatar;
        }
        
        // Вызываем функцию напрямую из store
        await useUsersStore.getState().updateUser(user.id, updateData);
      } else {
        const createData: any = {
          username: data.username,
          email: data.email,
          password: data.password || '',
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role!,
          is_active: data.is_active,
          birth_date: data.birth_date,
          about: data.about,
        };
        
        // Добавляем аватар только если он выбран
        if (data.avatar instanceof File) {
          createData.avatar = data.avatar;
        }
        
        // Вызываем функцию напрямую из store
        await useUsersStore.getState().createUser(createData);
      }
      
      onSuccess?.();
    } catch {
      // Ошибка уже обработана в store
    }
  };

  const handleCancel = () => {
    reset();
    // Вызываем функцию напрямую из store
    useUsersStore.getState().clearError();
    onCancel?.();
  };

  const getRoleName = (roleId: number) => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return 'Загрузка...';
    }
    
    const role = roles.find(r => r.id === roleId);
    if (!role) return 'Неизвестная роль';
    
    return role.name_display;
  };

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Редактировать пользователя' : 'Создать нового пользователя'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing 
              ? 'Обновите информацию о пользователе'
              : 'Заполните информацию для создания новой учетной записи'
            }
          </p>
        </div>

        {/* Ошибки API */}
        {storeError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="warning" size="lg" color="danger" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <div className="mt-1 text-sm text-red-700">
                  {storeError}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Имя пользователя */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Имя пользователя *
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.username 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="username"
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.email 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="user@example.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Имя */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Имя
              </label>
              <div className="mt-1">
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.first_name 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Иван"
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="mt-2 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
            </div>

            {/* Фамилия */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Фамилия
              </label>
              <div className="mt-1">
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.last_name 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Иванов"
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="mt-2 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Пароль */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {isEditing ? 'Новый пароль (оставьте пустым если не меняете)' : 'Пароль *'}
            </label>
            <div className="mt-1">
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.password 
                    ? 'border-red-300 text-red-900 placeholder-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder={isEditing ? 'Новый пароль' : 'Минимум 8 символов'}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Роль и статус */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Роль */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Роль *
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  {...register('role', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.role 
                      ? 'border-red-300 text-red-900' 
                      : 'border-gray-300'
                  }`}
                  disabled={isLoading || rolesLoading}
                >
                  <option value="">
                    {rolesLoading || roles.length === 0 ? 'Загрузка ролей...' : 'Выберите роль'}
                  </option>
                  {!rolesLoading && Array.isArray(roles) && roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleName(role.id)}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* Статус */}
            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
                Статус аккаунта
              </label>
              <div className="mt-1">
                <select
                  id="is_active"
                  {...register('is_active', {
                    setValueAs: (value) => value === 'true'
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={isLoading}
                >
                  <option value="true">Активный</option>
                  <option value="false">Заблокированный</option>
                </select>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Дополнительная информация</h3>
            
            {/* Дата рождения */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                Дата рождения
              </label>
              <div className="mt-1">
                <input
                  id="birth_date"
                  type="date"
                  {...register('birth_date')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* О пользователе */}
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                О пользователе
              </label>
              <div className="mt-1">
                <textarea
                  id="about"
                  rows={3}
                  {...register('about')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.about 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Краткая информация о пользователе"
                  disabled={isLoading}
                />
                {errors.about && (
                  <p className="mt-2 text-sm text-red-600">{errors.about.message}</p>
                )}
              </div>
            </div>

            {/* Аватар */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                Аватар
              </label>
              <div className="mt-1">
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue('avatar', file, { shouldDirty: true });
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF до 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !isValid || (!isDirty && isEditing)}
              loading={isLoading}
            >
              {isLoading 
                ? (isEditing ? 'Сохранение...' : 'Создание...') 
                : (isEditing ? 'Сохранить изменения' : 'Создать пользователя')
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default UserForm; 