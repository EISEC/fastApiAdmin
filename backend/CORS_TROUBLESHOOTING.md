# 🔧 Устранение проблем с CORS

## 📋 Краткая диагностика

### ✅ Проверка настроек CORS
```bash
# Запуск диагностики CORS
python3 manage.py test_cors

# Тестирование конкретного домена
python3 manage.py test_cors --domains https://ifuw.ru

# Тестирование другого endpoint
python3 manage.py test_cors --endpoint posts/
```

### ✅ Внешнее тестирование
```bash
# Запуск Python скрипта для тестирования
python3 test_cors.py
```

### ✅ Браузерное тестирование
Откройте файл `test_cors.html` в браузере для интерактивного тестирования.

## 🚨 Распространенные проблемы и решения

### 1. Домен не разрешен в CORS
**Проблема:** `Access-Control-Allow-Origin` заголовок отсутствует или не соответствует домену

**Решение:**
```python
# В settings/production.py
CORS_ALLOWED_ORIGINS = [
    "https://ifuw.ru",
    "https://www.ifuw.ru",
    "https://admin.ifuw.ru",
    "https://www.admin.ifuw.ru",
]
```

### 2. Домен не в ALLOWED_HOSTS
**Проблема:** Django отклоняет запросы от неразрешенных хостов

**Решение:**
```python
# В settings/production.py
ALLOWED_HOSTS = [
    'admin.ifuw.ru', 
    'eisec.beget.tech', 
    'ifuw.ru', 
    'www.ifuw.ru'
]
```

### 3. Middleware не в правильном порядке
**Проблема:** CORS middleware не первый в списке

**Решение:**
```python
# В settings/base.py
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ДОЛЖЕН БЫТЬ ПЕРВЫМ!
    'django.middleware.security.SecurityMiddleware',
    # ... остальные middleware
]
```

### 4. Preflight запросы блокируются
**Проблема:** OPTIONS запросы возвращают ошибку

**Решение:**
```python
# Добавить в settings
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',  # Обязательно!
    'PATCH',
    'POST',
    'PUT',
]
```

### 5. Заголовки не разрешены
**Проблема:** Браузер блокирует кастомные заголовки

**Решение:**
```python
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## 🔍 Диагностика в браузере

### Проверка в DevTools
1. Откройте DevTools (F12)
2. Перейдите в Network tab
3. Сделайте запрос к API
4. Проверьте заголовки ответа:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials`

### Типичные ошибки CORS в консоли
```
Access to fetch at 'https://admin.ifuw.ru/api/v1/sites/' from origin 'https://ifuw.ru' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.
```

## ⚙️ Настройки для разных окружений

### Development (разработка)
```python
# settings/development.py
CORS_ALLOW_ALL_ORIGINS = True  # Разрешить все домены
CORS_ALLOW_CREDENTIALS = True
```

### Production (продакшн)
```python
# settings/production.py
CORS_ALLOW_ALL_ORIGINS = False  # Только конкретные домены
CORS_ALLOWED_ORIGINS = [
    "https://ifuw.ru",
    "https://www.ifuw.ru",
    "https://admin.ifuw.ru",
]
CORS_ALLOW_CREDENTIALS = True
```

## 🚀 Дополнительные настройки

### Кэширование preflight запросов
```python
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 часа
```

### Открытие заголовков для frontend
```python
CORS_EXPOSE_HEADERS = [
    'content-type',
    'authorization',
]
```

### Regex для поддоменов
```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://\w+\.ifuw\.ru$",  # Любые поддомены ifuw.ru
]
```

## 🔧 Быстрое исправление

Если CORS не работает, выполните эти шаги:

1. **Проверьте настройки:**
   ```bash
   python3 manage.py test_cors
   ```

2. **Добавьте домен в CORS_ALLOWED_ORIGINS:**
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://ifuw.ru",  # Добавьте ваш домен
   ]
   ```

3. **Добавьте домен в ALLOWED_HOSTS:**
   ```python
   ALLOWED_HOSTS = [
       'ifuw.ru',  # Добавьте ваш домен
   ]
   ```

4. **Перезапустите сервер:**
   ```bash
   # Для development
   python3 manage.py runserver
   
   # Для production
   sudo systemctl restart gunicorn
   sudo systemctl restart nginx
   ```

5. **Проверьте результат:**
   ```bash
   python3 manage.py test_cors --domains https://ifuw.ru
   ```

## 📞 Поддержка

Если проблема не решается:
1. Проверьте логи Django: `tail -f logs/django.log`
2. Проверьте логи nginx: `tail -f /var/log/nginx/error.log`
3. Используйте инструменты диагностики из этого документа 