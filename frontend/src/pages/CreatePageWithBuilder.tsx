import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageBuilder from '../components/pageBuilder/PageBuilder';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { usePageBuilderStore } from '../store/pageBuilderStore';
import { usePagesStore } from '../store/pagesStore';

/**
 * Страница создания страницы с помощью конструктора блоков
 */
const CreatePageWithBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { blocks, exportBlocks } = usePageBuilderStore();
  const { createPage } = usePagesStore();
  
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    meta_description: '',
    site: 1 // Заглушка, в реальном приложении получаем из контекста
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!pageData.title.trim()) {
      return;
    }

    if (blocks.length === 0) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Экспортируем блоки в JSON
      const content = exportBlocks();
      
      // Создаем страницу
      await createPage({
        ...pageData,
        content,
        status: 'draft',
        visibility: 'public'
      });
      
      navigate('/pages');
      
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    await handleSave();
  };

  const handlePublish = async () => {
    try {
      const content = exportBlocks();
      
      await createPage({
        ...pageData,
        content,
        status: 'published',
        visibility: 'public'
      });
      
      navigate('/pages');
      
    } catch (error) {
      console.error('Error publishing page:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9а-я]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setPageData({
      ...pageData,
      title,
      slug: pageData.slug || generateSlug(title)
    });
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Верхняя панель */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/pages')}
                className="mr-4"
              >
                ← Назад к страницам
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <Input
                    placeholder="Название страницы"
                    value={pageData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
                
                <div className="w-48">
                  <Input
                    placeholder="URL (slug)"
                    value={pageData.slug}
                    onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 mr-4">
                Блоков: {blocks.length}
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveAsDraft}
                loading={isSaving}
                disabled={!pageData.title.trim() || blocks.length === 0}
              >
                💾 Сохранить черновик
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                loading={isSaving}
                disabled={!pageData.title.trim() || blocks.length === 0}
              >
                🚀 Опубликовать
              </Button>
            </div>
          </div>

          {/* Дополнительные поля */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Описание для SEO"
                value={pageData.meta_description}
                onChange={(e) => setPageData({ ...pageData, meta_description: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Конструктор страниц */}
        <div className="flex-1 overflow-hidden">
          <PageBuilder />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePageWithBuilder; 