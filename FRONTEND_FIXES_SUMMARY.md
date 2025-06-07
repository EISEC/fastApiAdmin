# Исправление проблемы зависания фронтенда

## 🐛 Проблема
Фронтенд загружался, но потом переставал отвечать и зависал.

## 🔍 Диагностика
1. **Бэкенд был не запущен** - API запросы висели без ответа
2. **Бесконечные циклы в useEffect** - вызывали перерендеринг компонентов
3. **Проблемы в store** - повторные запросы к API

## ✅ Исправления

### 1. Запуск бэкенда
```bash
cd backend && python3 manage.py runserver
```

### 2. Исправление DashboardLayout.tsx
**Проблема**: useEffect с зависимостями `[loadAll, settingsLoaded, socialLoaded]` создавал бесконечный цикл

**Исправление**:
```typescript
// ❌ Было:
useEffect(() => {
  if (!settingsLoaded || !socialLoaded) {
    loadAll();
  }
}, [loadAll, settingsLoaded, socialLoaded]);

// ✅ Стало:
useEffect(() => {
  if (!settingsLoaded || !socialLoaded) {
    loadAll();
  }
}, []); // Убираем зависимости, чтобы избежать бесконечного цикла
```

### 3. Исправление globalSettingsStore.ts
**Проблема**: loadSettings и loadSocialNetworks могли вызываться одновременно

**Исправление**:
```typescript
// ❌ Было:
if (state.settingsLoaded) {
  return; // Уже загружены
}

// ✅ Стало:
if (state.settingsLoaded || state.isSettingsLoading) {
  return; // Уже загружены или загружаются
}
```

### 4. Исправление App.tsx
**Проблема**: useCallback с checkAuth в зависимостях мог создавать цикл

**Исправление**:
```typescript
// ❌ Было:
const initAuth = useCallback(async () => {
  // ...
}, [checkAuth]);

useEffect(() => {
  initAuth();
}, [initAuth]);

// ✅ Стало:
useEffect(() => {
  const initAuth = async () => {
    // ...
  };
  initAuth();
}, []); // Убираем checkAuth из зависимостей
```

## 🛠️ Диагностическая страница
Создана страница `/debug` для проверки состояния всех store:
- Auth Store
- Global Settings
- Sites Store  
- Posts Store

## 📊 Результат
- ✅ Фронтенд больше не зависает
- ✅ API запросы выполняются корректно
- ✅ Нет бесконечных циклов
- ✅ Добавлена диагностика для будущих проблем

## 🔗 Доступ к диагностике
После авторизации:
- **Для суперадмина**: пункт "Диагностика" появится в сайдбаре (иконка 🐛)
- **Прямая ссылка**: `http://localhost:5173/debug`
- **Доступ**: только пользователи с ролью `superuser`

## 🚀 Обновления
- ✅ Добавлена ссылка в сайдбар только для суперадмина
- ✅ Использована иконка `bug` для диагностики
- ✅ Автоматическая фильтрация по ролям работает 