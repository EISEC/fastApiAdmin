import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { api } from '../../lib/axios.config';
import { useToastStore } from '../../store/toastStore';
import SocialNetworkForm from './SocialNetworkForm';

interface SocialNetwork {
  id: string;
  name: string;
  social_name: string;
  url: string;
  is_enabled: boolean;
  order: number;
  icon_name: string;
  created_at: string;
  updated_at: string;
}

interface SocialNetworkFormData {
  name: string;
  url: string;
  is_enabled: boolean;
}

const SOCIAL_CHOICES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter (X)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'vk', label: 'ВКонтакте' },
  { value: 'odnoklassniki', label: 'Одноклассники' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'discord', label: 'Discord' },
];

interface SortableItemProps {
  id: string;
  network: SocialNetwork;
  onEdit: (network: SocialNetwork) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, network, onEdit, onDelete, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <Icon name="menu" size="sm" />
        </div>
        
        <div className="flex items-center space-x-3">
          <Icon name={network.icon_name as any} size="md" color="primary" />
          <div>
            <p className="font-medium text-gray-900">{network.social_name}</p>
            <p className="text-sm text-gray-500 truncate max-w-xs">{network.url}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={network.is_enabled}
            onChange={(e) => onToggle(network.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Активна</span>
        </label>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(network)}
        >
          <Icon name="edit" size="sm" />
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(network.id)}
        >
          <Icon name="delete" size="sm" />
        </Button>
      </div>
    </div>
  );
};

const SocialNetworksManager: React.FC = () => {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<SocialNetwork | null>(null);
  const [formData, setFormData] = useState<SocialNetworkFormData>({
    name: '',
    url: '',
    is_enabled: true,
  });

  const { success, error } = useToastStore();

  // Открытие формы по событию
  React.useEffect(() => {
    const handler = () => {
      setShowForm(true);
      setEditingNetwork(null);
      setFormData({ name: '', url: '', is_enabled: true });
    };
    window.addEventListener('open-social-form', handler);
    return () => window.removeEventListener('open-social-form', handler);
  }, []);

  // Загрузка социальных сетей
  const loadNetworks = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ results: SocialNetwork[] }>('/settings/social-networks/');
      setNetworks(response.results);
    } catch (err: any) {
      error('Ошибка загрузки', err.response?.data?.detail || 'Не удалось загрузить социальные сети');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, []);

  // Сохранение социальной сети
  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      error('Ошибка валидации', 'Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      if (editingNetwork) {
        // Обновление
        await api.put(`/settings/social-networks/${editingNetwork.id}/`, formData);
        success('Социальная сеть обновлена', 'Изменения успешно сохранены');
      } else {
        // Создание
        await api.post('/settings/social-networks/', {
          ...formData,
          order: networks.length,
        });
        success('Социальная сеть добавлена', 'Новая социальная сеть успешно создана');
      }

      await loadNetworks();
      setShowForm(false);
      setEditingNetwork(null);
      setFormData({ name: '', url: '', is_enabled: true });
    } catch (err: any) {
      error('Ошибка сохранения', err.response?.data?.detail || 'Не удалось сохранить социальную сеть');
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление социальной сети
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены что хотите удалить эту социальную сеть?')) return;

    setIsLoading(true);
    try {
      await api.delete(`/settings/social-networks/${id}/`);
      success('Социальная сеть удалена', 'Социальная сеть успешно удалена');
      await loadNetworks();
    } catch (err: any) {
      error('Ошибка удаления', err.response?.data?.detail || 'Не удалось удалить социальную сеть');
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение активности
  const handleToggle = async (id: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      await api.patch(`/settings/social-networks/${id}/`, { is_enabled: enabled });
      await loadNetworks();
    } catch (err: any) {
      error('Ошибка обновления', err.response?.data?.detail || 'Не удалось обновить статус');
    } finally {
      setIsLoading(false);
    }
  };

  // Перетаскивание
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = networks.findIndex((item) => item.id === active.id);
      const newIndex = networks.findIndex((item) => item.id === over.id);
      
      const reorderedNetworks = arrayMove(networks, oldIndex, newIndex);
      setNetworks(reorderedNetworks);

      // Сохраняем новый порядок на сервере
      try {
        const items = reorderedNetworks.map((network, index) => ({
          id: network.id,
          order: index,
        }));
        
        await api.put('/settings/social-networks/reorder/', { items });
        success('Порядок обновлен', 'Новый порядок социальных сетей сохранен');
      } catch (err: any) {
        error('Ошибка сортировки', 'Не удалось сохранить новый порядок');
        await loadNetworks(); // Перезагружаем данные
      }
    }
  };

  // Редактирование
  const handleEdit = (network: SocialNetwork) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      url: network.url,
      is_enabled: network.is_enabled,
    });
    setShowForm(true);
  };

  // Отмена редактирования
  const handleCancel = () => {
    setShowForm(false);
    setEditingNetwork(null);
    setFormData({ name: '', url: '', is_enabled: true });
  };

  if (isLoading && networks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Форма создания/редактирования */}
      {showForm && (
        <SocialNetworkForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
          isEditing={!!editingNetwork}
          socialChoices={SOCIAL_CHOICES}
        />
      )}

      {/* Список социальных сетей */}
      {networks.length > 0 ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={networks.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {networks.map((network) => (
                <SortableItem
                  key={network.id}
                  id={network.id}
                  network={network}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8">
          <Icon name="mobile" size="2xl" color="gray" className="mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет социальных сетей
          </h3>
          <p className="text-gray-600 mb-4">
            Добавьте ссылки на ваши профили в социальных сетях
          </p>
        </div>
      )}
    </>
  );
};

export default SocialNetworksManager; 