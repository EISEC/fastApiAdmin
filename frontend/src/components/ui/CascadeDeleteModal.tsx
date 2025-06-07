import React, { useState, useEffect } from 'react';
import Button from './Button';
import Icon from './Icon';
import { useSitesStore } from '../../store/sitesStore';
import type { Site, SiteDeletePreview } from '../../types';

interface CascadeDeleteModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Модальное окно каскадного удаления сайта с предварительным просмотром
 */
const CascadeDeleteModal: React.FC<CascadeDeleteModalProps> = ({
  site,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { getDeletePreview, cascadeDelete, isLoading } = useSitesStore();
  const [preview, setPreview] = useState<SiteDeletePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Загружаем предварительный просмотр при открытии модального окна
  useEffect(() => {
    if (isOpen && site) {
      loadPreview();
    }
  }, [isOpen, site]);

  const loadPreview = async () => {
    if (!site) return;
    
    setIsLoadingPreview(true);
    try {
      const previewData = await getDeletePreview(site.id);
      setPreview(previewData);
    } catch (error) {
      console.error('Ошибка загрузки предварительного просмотра:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    if (!site) return;
    
    setIsDeleting(true);
    try {
      await cascadeDelete(site.id);
      onConfirm();
      onClose();
    } catch (error) {
      console.error('Ошибка каскадного удаления:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting && !isLoadingPreview) {
      setPreview(null);
      onClose();
    }
  };

  const getTotalObjects = (toBeDeleted: SiteDeletePreview['to_be_deleted']) => {
    return Object.values(toBeDeleted).reduce((sum, count) => sum + count, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <Icon name="warning" className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Каскадное удаление сайта
                </h3>
                <p className="text-sm text-gray-500">
                  Это действие нельзя отменить
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting || isLoadingPreview}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="close" size="lg" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-3">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Загрузка информации...</span>
              </div>
            ) : preview ? (
              <>
                {/* Site Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Icon name="globe" className="mr-2" />
                    Информация о сайте
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Название:</span> {preview.site_info.name}</p>
                    <p><span className="font-medium">Домен:</span> {preview.site_info.domain}</p>
                    <p><span className="font-medium">Владелец:</span> {preview.site_info.owner}</p>
                    <p><span className="font-medium">Статус:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        preview.site_info.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {preview.site_info.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* What will be deleted */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                    <Icon name="delete" className="mr-2 text-red-600" />
                    Будет удалено навсегда:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Icon name="file" size="sm" className="mr-2 text-red-500" />
                        Постов:
                      </span>
                      <span className="font-semibold text-red-700">{preview.to_be_deleted.posts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Icon name="folder" size="sm" className="mr-2 text-red-500" />
                        Страниц:
                      </span>
                      <span className="font-semibold text-red-700">{preview.to_be_deleted.pages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Icon name="folder" size="sm" className="mr-2 text-red-500" />
                        Категорий:
                      </span>
                      <span className="font-semibold text-red-700">{preview.to_be_deleted.categories}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Icon name="tag" size="sm" className="mr-2 text-red-500" />
                        Тегов:
                      </span>
                      <span className="font-semibold text-red-700">{preview.to_be_deleted.tags}</span>
                    </div>
                    <div className="flex items-center justify-between col-span-2">
                      <span className="flex items-center">
                        <Icon name="code" size="sm" className="mr-2 text-red-500" />
                        Динамических моделей:
                      </span>
                      <span className="font-semibold text-red-700">{preview.to_be_deleted.dynamic_models}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span className="text-red-900">ВСЕГО ОБЪЕКТОВ:</span>
                      <span className="text-red-800 text-lg">{getTotalObjects(preview.to_be_deleted)}</span>
                    </div>
                  </div>
                </div>

                {/* Affected users */}
                {preview.users_affected.assigned_users > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                      <Icon name="users" className="mr-2 text-yellow-600" />
                      Затронутые пользователи ({preview.users_affected.assigned_users})
                    </h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      Эти пользователи потеряют доступ к сайту:
                    </p>
                    <div className="space-y-1">
                      {preview.users_affected.assigned_users_list.map(user => (
                        <div key={user.id} className="flex items-center text-sm">
                          <Icon name="user" size="sm" className="mr-2 text-yellow-600" />
                          <span className="font-medium">{user.username}</span>
                          <span className="text-yellow-700 ml-2">({user.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                      <Icon name="alert" className="mr-2 text-orange-600" />
                      Предупреждения
                    </h4>
                    <ul className="space-y-1">
                      {preview.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start text-sm text-orange-800">
                          <Icon name="warning" size="sm" className="mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Icon name="warning" className="mx-auto h-12 w-12 text-red-400 mb-2" />
                <p className="text-gray-600">Не удалось загрузить информацию для предварительного просмотра</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isDeleting || isLoadingPreview}
              className="mt-3 sm:mt-0"
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={isDeleting || isLoadingPreview || !preview}
              loading={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Удаление...' : 'Подтвердить удаление'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CascadeDeleteModal; 