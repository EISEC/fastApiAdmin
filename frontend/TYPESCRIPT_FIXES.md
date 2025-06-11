# План исправления TypeScript ошибок

## Категории ошибок (88 штук):

### 1. CacheDemo (6 ошибок)
- ❌ `cacheStats.entries` не существует → `cacheStats?.total_requests`
- ❌ `cacheStats.hitRate` не существует → `cacheStats?.hit_rate`
- ❌ `cacheStats` может быть null → добавить `?.`

### 2. DynamicModelBuilder (1 ошибка)
- ❌ `e.target.value` для Select → `value`

### 3. GlobalSettings Store (12 ошибок)
- ❌ Отсутствуют свойства: `loadAll`, `settingsLoaded`, `socialLoaded`
- ❌ Отсутствуют геттеры: `getSiteName`, `getSiteDescription`, `getAdminEmail`

### 4. useSettings Hook (10 ошибок)
- ❌ Неправильные типы SocialNetwork
- ❌ Отсутствующие свойства: `isLoading`, `settingsLoaded`

### 5. Type Assertions (15 ошибок)
- ❌ `unknown` → нужно приведение к `string`
- ❌ `{}` → нужно приведение к `ReactNode`

### 6. Debug Panel (4 ошибки)
- ❌ Отсутствуют: `debugInfo`, `clearDebugInfo`

### 7. File Paths (множественные)
- ❌ Select компонент onChange несовместимость
- ❌ RoleBasedDashboard типы User и Post

## Порядок исправления:
1. ✅ GlobalSettings Store
2. ✅ useSettings Hook
3. ✅ useDebugMode Hook
4. ✅ Type assertions
5. ✅ Component specific fixes 