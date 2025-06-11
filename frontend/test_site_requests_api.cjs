/**
 * Тестирование API системы запросов доступа к сайтам
 * Использование: node test_site_requests_api.js
 */

const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const TEST_USER = {
  email: 'pipka@eisec.ru',
  password: 'Pipi1234'
};

// Глобальные переменные
let authToken = null;
let testRequestId = null;

/**
 * Утилита для логирования
 */
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  divider: () => console.log('─'.repeat(50))
};

/**
 * Создание Axios клиента с токеном
 */
const createApiClient = () => {
  return axios.create({
    baseURL: BASE_URL,
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Авторизация пользователя
 */
async function login() {
  log.info('Авторизация пользователя...');
  
  try {
    const api = createApiClient();
    const response = await api.post('/auth/token/', TEST_USER);
    
    authToken = response.data.access;
    log.success(`Авторизация успешна! Токен получен.`);
    log.info(`Пользователь: ${TEST_USER.email}`);
    
    return true;
  } catch (error) {
    log.error(`Ошибка авторизации: ${error.response?.data?.detail || error.message}`);
    return false;
  }
}

/**
 * Тест 1: Получение доступных сайтов
 */
async function testAvailableSites() {
  log.info('Тест 1: Получение доступных сайтов');
  
  try {
    const api = createApiClient();
    const response = await api.get('/sites/requests/available_sites/');
    
    log.success(`Загружено ${response.data.length} доступных сайтов`);
    
    if (response.data.length > 0) {
      log.info('Примеры сайтов:');
      response.data.slice(0, 3).forEach(site => {
        log.info(`  - ${site.name} (${site.domain})`);
      });
    }
    
    return response.data;
  } catch (error) {
    log.error(`Ошибка получения сайтов: ${error.response?.status} ${error.response?.statusText}`);
    return [];
  }
}

/**
 * Тест 2: Получение моих запросов
 */
async function testMyRequests() {
  log.info('Тест 2: Получение моих запросов');
  
  try {
    const api = createApiClient();
    const response = await api.get('/sites/requests/my_requests/');
    
    log.success(`Найдено ${response.data.length} запросов пользователя`);
    
    if (response.data.length > 0) {
      log.info('Статусы запросов:');
      const statusCount = {};
      response.data.forEach(req => {
        statusCount[req.status] = (statusCount[req.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        log.info(`  - ${status}: ${count}`);
      });
    }
    
    return response.data;
  } catch (error) {
    log.error(`Ошибка получения запросов: ${error.response?.status} ${error.response?.statusText}`);
    return [];
  }
}

/**
 * Тест 3: Создание нового запроса
 */
async function testCreateRequest(availableSites) {
  log.info('Тест 3: Создание нового запроса');
  
  if (!availableSites || availableSites.length === 0) {
    log.warning('Нет доступных сайтов для создания запроса');
    return null;
  }
  
  const testSite = availableSites[0];
  
  try {
    const api = createApiClient();
    const requestData = {
      site: testSite.id,
      requested_role: 'author',
      message: `Тестовый запрос от ${TEST_USER.email} - ${new Date().toISOString()}`
    };
    
    const response = await api.post('/sites/requests/', requestData);
    
    testRequestId = response.data.id;
    log.success(`Запрос создан с ID: ${testRequestId}`);
    log.info(`Сайт: ${testSite.name}`);
    log.info(`Роль: ${requestData.requested_role}`);
    log.info(`Статус: ${response.data.status}`);
    
    return response.data;
  } catch (error) {
    log.error(`Ошибка создания запроса: ${error.response?.data?.message || error.message}`);
    
    // Показываем детали ошибки
    if (error.response?.data) {
      Object.entries(error.response.data).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          errors.forEach(err => log.error(`  ${field}: ${err}`));
        }
      });
    }
    
    return null;
  }
}

/**
 * Тест 4: Получение деталей запроса
 */
async function testRequestDetails() {
  if (!testRequestId) {
    log.warning('Нет ID запроса для тестирования деталей');
    return null;
  }
  
  log.info(`Тест 4: Получение деталей запроса ID: ${testRequestId}`);
  
  try {
    const api = createApiClient();
    const response = await api.get(`/sites/requests/${testRequestId}/`);
    
    log.success('Детали запроса получены');
    log.info(`Пользователь: ${response.data.user_name}`);
    log.info(`Сайт: ${response.data.site_name}`);
    log.info(`Роль: ${response.data.requested_role}`);
    log.info(`Статус: ${response.data.status}`);
    log.info(`Создан: ${new Date(response.data.created_at).toLocaleString('ru-RU')}`);
    
    return response.data;
  } catch (error) {
    log.error(`Ошибка получения деталей: ${error.response?.status} ${error.response?.statusText}`);
    return null;
  }
}

/**
 * Тест 5: Отмена запроса
 */
async function testCancelRequest() {
  if (!testRequestId) {
    log.warning('Нет ID запроса для отмены');
    return false;
  }
  
  log.info(`Тест 5: Отмена запроса ID: ${testRequestId}`);
  
  try {
    const api = createApiClient();
    await api.post(`/sites/requests/${testRequestId}/cancel_request/`);
    
    log.success('Запрос успешно отменен');
    return true;
  } catch (error) {
    log.error(`Ошибка отмены запроса: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Тест 6: Проверка запросов на рассмотрение (для админов)
 */
async function testPendingReviews() {
  log.info('Тест 6: Получение запросов на рассмотрение');
  
  try {
    const api = createApiClient();
    const response = await api.get('/sites/requests/pending_reviews/');
    
    log.success(`Найдено ${response.data.length} запросов на рассмотрение`);
    
    if (response.data.length > 0) {
      log.info('Последние запросы:');
      response.data.slice(0, 3).forEach(req => {
        log.info(`  - ${req.user_name} → ${req.site_name} (${req.requested_role})`);
      });
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      log.warning('Нет прав доступа к запросам на рассмотрение (только для админов)');
    } else {
      log.error(`Ошибка получения запросов: ${error.response?.status} ${error.response?.statusText}`);
    }
    return [];
  }
}

/**
 * Главная функция тестирования
 */
async function runTests() {
  console.log('🧪 ТЕСТИРОВАНИЕ API СИСТЕМЫ ЗАПРОСОВ ДОСТУПА К САЙТАМ');
  log.divider();
  
  // Авторизация
  const loginSuccess = await login();
  if (!loginSuccess) {
    log.error('Тестирование прервано из-за ошибки авторизации');
    return;
  }
  
  log.divider();
  
  // Тесты API
  const availableSites = await testAvailableSites();
  log.divider();
  
  await testMyRequests();
  log.divider();
  
  const newRequest = await testCreateRequest(availableSites);
  log.divider();
  
  if (newRequest) {
    await testRequestDetails();
    log.divider();
  }
  
  await testPendingReviews();
  log.divider();
  
  if (testRequestId) {
    await testCancelRequest();
    log.divider();
  }
  
  log.success('🎉 Тестирование завершено!');
  
  // Финальная сводка
  console.log('\n📊 СВОДКА ТЕСТИРОВАНИЯ:');
  log.info(`✅ Авторизация: ${loginSuccess ? 'Успешно' : 'Ошибка'}`);
  log.info(`📋 Доступные сайты: ${availableSites.length}`);
  log.info(`📝 Создание запроса: ${newRequest ? 'Успешно' : 'Ошибка'}`);
  log.info(`🔍 Детали запроса: ${testRequestId ? 'Успешно' : 'Ошибка'}`);
  log.info(`❌ Отмена запроса: ${testRequestId ? 'Протестировано' : 'Пропущено'}`);
}

// Запуск тестов
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Критическая ошибка: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  login,
  testAvailableSites,
  testMyRequests,
  testCreateRequest,
  testRequestDetails,
  testCancelRequest,
  testPendingReviews
}; 