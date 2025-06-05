# План реализации системы динамических моделей

## 📋 Общий план

### Этап 1: Анализ и доработка Backend моделей
✅ **Статус:** В процессе

#### 1.1 Доработка существующих моделей
- [x] Изучить существующие модели DynamicModel и DynamicModelData
- [ ] Добавить поддержку расширения существующих моделей
- [ ] Реализовать валидацию полей с кастомными правилами
- [ ] Добавить систему версионности изменений
- [ ] Реализовать экспорт/импорт конфигураций

#### 1.2 Новые модели
- [ ] **DynamicFieldType** - типы полей с расширенной конфигурацией
- [ ] **DynamicModelExtension** - расширения существующих моделей
- [ ] **DynamicModelVersion** - версионность моделей
- [ ] **DynamicModelPermission** - права доступа к моделям

### Этап 2: Backend API и сервисы
🔄 **Статус:** Планируется

#### 2.1 API endpoints
- [ ] CRUD для DynamicModel с контролем прав доступа
- [ ] API для работы с данными динамических моделей
- [ ] Endpoints для предварительного просмотра
- [ ] API для экспорта/импорта конфигураций
- [ ] Endpoints для работы с расширениями существующих моделей

#### 2.2 Сервисы
- [ ] **DynamicModelService** - основная логика работы с моделями
- [ ] **DynamicValidationService** - валидация данных
- [ ] **DynamicPermissionService** - управление правами доступа
- [ ] **DynamicExportImportService** - экспорт/импорт конфигураций

### Этап 3: Frontend компоненты
🔄 **Статус:** Планируется

#### 3.1 Основные компоненты
- [ ] **DynamicModelBuilder** - конструктор моделей
- [ ] **FieldTypeSelector** - выбор типов полей
- [ ] **FieldConfigEditor** - редактор конфигурации полей
- [ ] **ModelPreview** - предварительный просмотр
- [ ] **DynamicForm** - форма для ввода данных

#### 3.2 UI компоненты
- [ ] **DragDropFieldList** - перетаскивание полей
- [ ] **ValidationRuleEditor** - редактор правил валидации
- [ ] **PermissionMatrix** - матрица прав доступа
- [ ] **ExportImportModal** - модал экспорта/импорта

### Этап 4: Интеграция и тестирование
🔄 **Статус:** Планируется

#### 4.1 Интеграция с существующими моделями
- [ ] Интеграция с моделью Posts
- [ ] Интеграция с моделью Pages
- [ ] Интеграция с моделью Sites
- [ ] Тестирование совместимости

#### 4.2 Тестирование
- [ ] Unit тесты для всех компонентов
- [ ] Integration тесты API
- [ ] Frontend тесты компонентов
- [ ] E2E тесты полного цикла

---

## 🛠 Детальная реализация

### Backend модели

#### DynamicModel (расширение существующей)
```python
class DynamicModel(models.Model):
    # Добавляем новые поля
    MODEL_TYPES = [
        ('standalone', 'Отдельная модель'),
        ('extension', 'Расширение существующей модели'),
    ]
    
    model_type = models.CharField(
        max_length=20,
        choices=MODEL_TYPES,
        default='standalone',
        verbose_name='Тип модели'
    )
    
    target_model = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Целевая модель',
        help_text='Модель для расширения (например: posts.Post)'
    )
    
    version = models.PositiveIntegerField(
        default=1,
        verbose_name='Версия'
    )
    
    # Добавляем методы для работы с расширениями
    def get_target_model_class(self):
        """Возвращает класс целевой модели"""
        pass
    
    def create_extension_fields(self):
        """Создает поля расширения"""
        pass
```

#### DynamicFieldType (новая модель)
```python
class DynamicFieldType(models.Model):
    """Расширенная конфигурация типов полей"""
    
    FIELD_TYPES = [
        ('text', 'Текст'),
        ('textarea', 'Многострочный текст'),
        ('rich_text', 'Форматированный текст'),
        ('number', 'Число'),
        ('decimal', 'Десятичное число'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('phone', 'Телефон'),
        ('date', 'Дата'),
        ('datetime', 'Дата и время'),
        ('time', 'Время'),
        ('boolean', 'Да/Нет'),
        ('select', 'Выпадающий список'),
        ('multiselect', 'Множественный выбор'),
        ('radio', 'Радиокнопки'),
        ('checkbox', 'Флажки'),
        ('file', 'Файл'),
        ('image', 'Изображение'),
        ('gallery', 'Галерея изображений'),
        ('json', 'JSON'),
        ('color', 'Цвет'),
        ('range', 'Диапазон'),
        ('rating', 'Рейтинг'),
        ('relation', 'Связь с другой моделью'),
    ]
    
    name = models.CharField(max_length=50, choices=FIELD_TYPES)
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_config = models.JSONField(default=dict)
    validation_rules = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
```

### API структура

#### ViewSets
```python
class DynamicModelViewSet(ModelViewSet):
    """ViewSet для работы с динамическими моделями"""
    
    def get_queryset(self):
        """Фильтруем по сайту и правам доступа"""
        pass
    
    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Предварительный просмотр модели"""
        pass
    
    @action(detail=True, methods=['get'])
    def export_config(self, request, pk=None):
        """Экспорт конфигурации модели"""
        pass
    
    @action(detail=False, methods=['post'])
    def import_config(self, request):
        """Импорт конфигурации модели"""
        pass

class DynamicModelDataViewSet(ModelViewSet):
    """ViewSet для работы с данными динамических моделей"""
    
    def get_queryset(self):
        """Фильтруем по модели и правам доступа"""
        pass
    
    def create(self, request, *args, **kwargs):
        """Создание записи с валидацией"""
        pass
    
    def update(self, request, *args, **kwargs):
        """Обновление записи с валидацией"""
        pass
```

### Frontend компоненты

#### DynamicModelBuilder
```typescript
interface DynamicModelBuilderProps {
  siteId: string;
  modelId?: string;
  onSave: (model: DynamicModel) => void;
  onCancel: () => void;
}

const DynamicModelBuilder: React.FC<DynamicModelBuilderProps> = ({
  siteId,
  modelId,
  onSave,
  onCancel
}) => {
  // Состояние модели
  const [model, setModel] = useState<DynamicModel | null>(null);
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Drag and Drop для полей
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  return (
    <div className="dynamic-model-builder">
      {/* Заголовок и настройки модели */}
      <ModelHeader model={model} onModelChange={setModel} />
      
      {/* Конструктор полей */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <FieldsBuilder 
          fields={fields} 
          onFieldsChange={setFields}
        />
      </DndContext>
      
      {/* Предварительный просмотр */}
      {previewMode && (
        <ModelPreview 
          model={model} 
          fields={fields} 
        />
      )}
      
      {/* Действия */}
      <BuilderActions 
        onSave={() => onSave(model)}
        onCancel={onCancel}
        onPreview={() => setPreviewMode(!previewMode)}
      />
    </div>
  );
};
```

---

## 🔐 Система прав доступа

### Backend права
```python
class DynamicModelPermission(BasePermission):
    """Права доступа к динамическим моделям"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админ может создавать модели для своих сайтов
        if user_role == 'admin':
            return True
        
        # Авторы могут только просматривать и заполнять
        if user_role == 'author' and view.action in ['list', 'retrieve']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        user_role = request.user.role.name
        
        if user_role == 'superuser':
            return True
        
        # Админ может работать только со своими сайтами
        if user_role == 'admin':
            return obj.site.owner == request.user
        
        # Авторы могут работать с моделями сайтов, где они являются авторами
        if user_role == 'author':
            return request.user in obj.site.assigned_users.all()
        
        return False
```

### Frontend права
```typescript
const usePermissions = () => {
  const { user } = useAuthStore();
  
  const canCreateModel = useMemo(() => {
    return user?.role === 'superuser' || user?.role === 'admin';
  }, [user]);
  
  const canEditModel = useMemo(() => {
    return user?.role === 'superuser' || user?.role === 'admin';
  }, [user]);
  
  const canDeleteModel = useMemo(() => {
    return user?.role === 'superuser' || user?.role === 'admin';
  }, [user]);
  
  const canFillData = useMemo(() => {
    return user?.role !== 'user';
  }, [user]);
  
  return {
    canCreateModel,
    canEditModel,
    canDeleteModel,
    canFillData
  };
};
```

---

## 📈 Этапы реализации

### Неделя 1: Backend фундамент
- [x] Анализ существующего кода
- [ ] Доработка моделей DynamicModel и DynamicModelData
- [ ] Создание новых моделей для расширений
- [ ] Базовые API endpoints

### Неделя 2: Backend логика
- [ ] Сервисы для работы с моделями
- [ ] Система валидации
- [ ] Права доступа
- [ ] Тестирование API

### Неделя 3: Frontend основа
- [ ] Базовые компоненты
- [ ] Конструктор полей
- [ ] Интеграция с API
- [ ] Базовая стилизация

### Неделя 4: Frontend продвинутые функции
- [ ] Drag & Drop интерфейс
- [ ] Предварительный просмотр
- [ ] Экспорт/импорт
- [ ] Расширенная валидация

### Неделя 5: Интеграция и тестирование
- [ ] Интеграция с существующими моделями
- [ ] Полное тестирование
- [ ] Документация
- [ ] Деплой и финальные тесты

---

## 🎯 Критерии готовности

### Backend готов когда:
- [ ] Все API endpoints работают корректно
- [ ] Система прав доступа функционирует
- [ ] Валидация данных работает
- [ ] Есть поддержка расширений существующих моделей
- [ ] Все тесты проходят

### Frontend готов когда:
- [ ] Конструктор моделей полностью функционален
- [ ] Drag & Drop работает корректно
- [ ] Предварительный просмотр отображается правильно
- [ ] Формы валидируются
- [ ] Интерфейс интуитивно понятен

### Система готова когда:
- [ ] Админ может создать модель "Преимущества"
- [ ] Админ может расширить модель "Посты"
- [ ] Авторы могут заполнять созданные модели
- [ ] Данные корректно сохраняются и отображаются
- [ ] Система работает стабильно под нагрузкой

---

## 📚 Документация

### Файлы документации для создания:
- [ ] **DYNAMIC_MODELS_GUIDE.md** - руководство пользователя
- [ ] **DYNAMIC_MODELS_API.md** - документация API
- [ ] **DYNAMIC_MODELS_EXAMPLES.md** - примеры использования
- [ ] **DYNAMIC_MODELS_TROUBLESHOOTING.md** - решение проблем

### Обновление существующих файлов:
- [ ] Обновить **COMPONENTS.md** с новыми компонентами
- [ ] Обновить **API_SUMMARY.md** с новыми endpoints
- [ ] Обновить **README.md** с описанием системы 