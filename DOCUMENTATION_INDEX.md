# 📚 Индекс документации проекта

## 🎯 Критически важные файлы (ОБЯЗАТЕЛЬНО к изучению)

### 🔧 Исправления и устранение проблем
- **[FRONTEND_BACKEND_FIXES.md](./FRONTEND_BACKEND_FIXES.md)** - Полная документация всех исправлений интеграции frontend-backend
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Быстрое устранение распространенных проблем
- **[DEVELOPER_CHECKLIST.md](./DEVELOPER_CHECKLIST.md)** - Чеклист для разработчиков

---

## 📖 Основная документация

### Backend
- **[backend/README.md](./backend/README.md)** - Основная документация backend
- **[backend/COMPONENTS.md](./backend/COMPONENTS.md)** - Детальное описание всех компонентов Django
- **[backend/STYLE_GUIDE.md](./backend/STYLE_GUIDE.md)** - Руководство по стилю кодирования
- **[backend/API_SUMMARY.md](./backend/API_SUMMARY.md)** - Справка по всем API endpoints (137 штук)
- **[backend/COMPLETION_REPORT.md](./backend/COMPLETION_REPORT.md)** - Отчет о завершении backend

### Frontend
- **[frontend/README.md](./frontend/README.md)** - Основная документация frontend
- **[frontend/COMPONENTS.md](./frontend/COMPONENTS.md)** - Документация React компонентов
- **[frontend/STYLE_GUIDE.md](./frontend/STYLE_GUIDE.md)** - Руководство по стилистике UI

---

## 🛠 Правила разработки

### Cursor Rules (для ИИ ассистентов)
- **[.cursor/rules/critical_fixes_rules.mdc](./.cursor/rules/critical_fixes_rules.mdc)** - КРИТИЧЕСКИЕ исправления и предупреждения
- **[.cursor/rules/backend_development_rules.mdc](./.cursor/rules/backend_development_rules.mdc)** - Правила разработки backend
- **[.cursor/rules/frontend_development_rules.mdc](./.cursor/rules/frontend_development_rules.mdc)** - Правила разработки frontend

### Общие правила
- **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - Общие правила разработки

---

## 📋 Порядок изучения документации

### Для новых разработчиков:

#### 1. Старт (ОБЯЗАТЕЛЬНО):
1. **[FRONTEND_BACKEND_FIXES.md](./FRONTEND_BACKEND_FIXES.md)** - Изучите ВСЕ исправления
2. **[DEVELOPER_CHECKLIST.md](./DEVELOPER_CHECKLIST.md)** - Запомните чеклист
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Ознакомьтесь с проблемами

#### 2. Backend разработка:
1. **[backend/README.md](./backend/README.md)** - Установка и настройка
2. **[backend/COMPONENTS.md](./backend/COMPONENTS.md)** - Архитектура приложений
3. **[backend/STYLE_GUIDE.md](./backend/STYLE_GUIDE.md)** - Стандарты кодирования
4. **[backend/API_SUMMARY.md](./backend/API_SUMMARY.md)** - API справочник

#### 3. Frontend разработка:
1. **[frontend/README.md](./frontend/README.md)** - Установка и настройка
2. **[frontend/COMPONENTS.md](./frontend/COMPONENTS.md)** - UI компоненты
3. **[frontend/STYLE_GUIDE.md](./frontend/STYLE_GUIDE.md)** - Дизайн система

---

## 🔍 Поиск по проблемам

### Проблемы с постами:
- [Кнопка создания неактивна](./TROUBLESHOOTING.md#2-кнопка-создать-пост-неактивна) 
- [Файлы не загружаются](./TROUBLESHOOTING.md#1-файл-не-является-корректным-файлом)
- [Ошибки валидации формы](./FRONTEND_BACKEND_FIXES.md#2-валидация-форм-postform)

### Проблемы с API:
- [404 ошибки endpoints](./TROUBLESHOOTING.md#4-404-ошибки-api-endpoints)
- [Ошибки сериализации](./TROUBLESHOOTING.md#3-ошибки-сериализации-тегов)
- [Проблемы с авторизацией](./TROUBLESHOOTING.md#5-проблемы-с-сохранением)

### Проблемы с файлами:
- [FormData обработка](./FRONTEND_BACKEND_FIXES.md#1-загрузка-файлов-featured-images)
- [Multipart/form-data](./TROUBLESHOOTING.md#файлы-не-загружаются)

---

## 📊 Статистика проекта

### Backend:
- **137 API endpoints** полностью работают
- **8 Django приложений** реализованы
- **15+ моделей** оптимизированы
- **100% готовность** к использованию

### Frontend:
- **React 18 + TypeScript** полная типизация
- **Все компоненты** документированы
- **Zustand stores** настроены
- **Интеграция с backend** протестирована

### Исправления:
- **5 критических проблем** решены
- **100% функциональность** восстановлена
- **Загрузка файлов** работает корректно
- **Валидация форм** исправлена

---

## 🚨 Критически важные предупреждения

### ❌ НЕ ИЗМЕНЯЙТЕ без изучения документации:
- `frontend/src/store/postsStore.ts` - Логика FormData
- `frontend/src/components/forms/PostForm.tsx` - Zod схема валидации
- `backend/apps/posts/serializers.py` - Поля tags без source
- API endpoints пути в frontend stores

### ✅ ВСЕГДА ПРОВЕРЯЙТЕ:
- Создание поста с файлом и без него
- Валидацию всех форм
- Отсутствие ошибок в консоли/логах
- Синхронизацию типов frontend-backend

---

## 🔗 Быстрые ссылки

### Локальные серверы:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5174
- **API Documentation:** http://localhost:8000/api/v1/swagger/

### Команды запуска:
```bash
# Backend
cd backend && python3 manage.py runserver

# Frontend
cd frontend && yarn dev
```

### Команды проверки:
```bash
# Backend
python3 manage.py check
python3 manage.py check_api_urls

# Frontend
yarn type-check
yarn build
```

---

## 📝 Обновление документации

При внесении изменений **ОБЯЗАТЕЛЬНО** обновляйте:
1. Соответствующие файлы документации
2. Этот индекс (если добавляются новые файлы)
3. DEVELOPER_CHECKLIST.md (если меняются процедуры)
4. TROUBLESHOOTING.md (если решаете новые проблемы)

---

> **💡 Совет:** Добавьте этот файл в закладки - он поможет быстро найти нужную документацию! 