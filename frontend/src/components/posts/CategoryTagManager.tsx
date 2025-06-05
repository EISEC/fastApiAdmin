import React from 'react';
import { clsx } from 'clsx';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import type { Category, Tag } from '../../types/post.types';

interface CategoryTagManagerProps {
  categories: Category[];
  tags: Tag[];
  selectedCategories: number[];
  selectedTags: number[];
  onCategoriesChange: (categoryIds: number[]) => void;
  onTagsChange: (tagIds: number[]) => void;
  siteId?: number;
  className?: string;
  onCreateCategory: () => void;
  onCreateTag: () => void;
}

/**
 * Компонент для управления категориями и тегами постов
 * Позволяет выбирать существующие и создавать новые
 */
const CategoryTagManager: React.FC<CategoryTagManagerProps> = ({
  categories,
  tags,
  selectedCategories,
  selectedTags,
  onCategoriesChange,
  onTagsChange,
  siteId,
  className,
  onCreateCategory,
  onCreateTag
}) => {
  const handleCategoryToggle = (categoryId: number) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoriesChange(newSelected);
  };

  const handleTagToggle = (tagId: number) => {
    const newSelected = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onTagsChange(newSelected);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Категории */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            <Icon name="folder" size="xs" className="mr-1" />
            Категории
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCreateCategory}
          >
            <Icon name="add" size="xs" className="mr-1" />
            Создать
          </Button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              Нет доступных категорий
            </div>
          ) : (
            categories.map((category) => (
              <label
                key={category.id}
                className={clsx(
                  'flex items-center p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedCategories.includes(category.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500">
                        {category.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {category.posts_count} постов
                  </div>
                </div>
                {selectedCategories.includes(category.id) && (
                  <Icon name="check" size="sm" className="text-blue-600 ml-2" />
                )}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Теги */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            <Icon name="tag" size="xs" className="mr-1" />
            Теги
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCreateTag}
          >
            <Icon name="add" size="xs" className="mr-1" />
            Создать
          </Button>
        </div>

        {/* Список доступных тегов */}
        {tags.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">
              Доступные теги:
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={clsx(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    selectedTags.includes(tag.id)
                      ? 'border-blue-300 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {tag.name}
                  <span className="ml-1 text-gray-400">({tag.posts_count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Выбранные теги */}
        {selectedTags.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">
              Выбранные теги:
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tagId)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTagManager; 