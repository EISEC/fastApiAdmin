/**
 * Расширенная диагностика проблемы с правами доступа
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const TEST_USER = {
  email: 'pipka@eisec.ru',
  password: 'Pipi1234'
};

async function advancedDiagnosis() {
  console.log('🔍 РАСШИРЕННАЯ ДИАГНОСТИКА ПРОБЛЕМЫ С ПРАВАМИ');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    // 1. Авторизация
    console.log('\n1. 🔐 Авторизация...');
    const authResponse = await axios.post(`${BASE_URL}/auth/token/`, TEST_USER);
    const token = authResponse.data.access;
    console.log('✅ Токен получен');
    console.log(`📱 Access Token: ${token.substring(0, 50)}...`);
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Детальная информация о пользователе
    console.log('\n2. 👤 Детальная информация о пользователе:');
    try {
      const userResponse = await api.get('/auth/me/');
      const user = userResponse.data;
      
      console.log('✅ Пользователь загружен:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🔒 Роль: ${JSON.stringify(user.role)}`);
      console.log(`   ✅ is_active: ${user.is_active}`);
      console.log(`   🛡️ is_superuser: ${user.is_superuser}`);
      console.log(`   📊 is_staff: ${user.is_staff}`);
      
      // Проверяем, что роль правильно определяется
      if (user.role && user.role.name === 'user') {
        console.log('✅ Роль "user" определена корректно');
      } else {
        console.log(`❌ Проблема с ролью! Ожидалось "user", получено: ${user.role?.name || 'НЕТ РОЛИ'}`);
      }
      
    } catch (error) {
      console.log('❌ Ошибка получения данных пользователя:', error.response?.status);
      return;
    }
    
    // 3. Проверка доступных сайтов
    console.log('\n3. 🌐 Проверка доступных сайтов:');
    try {
      const sitesResponse = await api.get('/sites/requests/available_sites/');
      console.log(`✅ Найдено доступных сайтов: ${sitesResponse.data.length}`);
      
      sitesResponse.data.forEach((site, index) => {
        console.log(`   ${index + 1}. 🏠 ${site.name} (ID: ${site.id}, домен: ${site.domain})`);
      });
      
    } catch (error) {
      console.log(`❌ Ошибка получения доступных сайтов: ${error.response?.status}`);
      console.log(`💬 Сообщение: ${error.response?.data?.detail || error.message}`);
    }
    
    // 4. Попытка создания запроса с debug информацией
    console.log('\n4. 📝 Детальная попытка создания запроса:');
    try {
      const sitesResponse = await api.get('/sites/requests/available_sites/');
      
      if (sitesResponse.data.length === 0) {
        console.log('⚠️ Нет доступных сайтов для создания запроса');
        return;
      }
      
      const testSite = sitesResponse.data[0];
      console.log(`📍 Используем сайт: ${testSite.name} (ID: ${testSite.id})`);
      
      const requestData = {
        site: testSite.id,
        requested_role: 'author',
        message: 'Детальный диагностический тест создания запроса'
      };
      
      console.log(`📊 Данные запроса: ${JSON.stringify(requestData, null, 2)}`);
      
      // Отправляем запрос с перехватом полного ответа
      try {
        const createResponse = await api.post('/sites/requests/', requestData);
        console.log('✅ УСПЕХ! Запрос создан успешно!');
        console.log(`   🆔 ID: ${createResponse.data.id}`);
        console.log(`   📊 Статус: ${createResponse.data.status}`);
        console.log(`   📅 Создан: ${createResponse.data.created_at}`);
        
        // Отменяем тестовый запрос
        try {
          await api.delete(`/sites/requests/${createResponse.data.id}/cancel_request/`);
          console.log('✅ Тестовый запрос успешно отменен');
        } catch (e) {
          console.log('⚠️ Не удалось отменить тестовый запрос');
        }
        
      } catch (createError) {
        console.log('❌ ОШИБКА создания запроса:');
        console.log(`   📊 HTTP статус: ${createError.response?.status}`);
        console.log(`   🔗 URL: ${createError.config?.url}`);
        console.log(`   📨 Метод: ${createError.config?.method?.toUpperCase()}`);
        console.log(`   🔑 Заголовки: ${JSON.stringify(createError.config?.headers || {})}`);
        console.log(`   💬 Сообщение: ${createError.response?.data?.detail || createError.message}`);
        
        if (createError.response?.data) {
          console.log(`   📝 Полный ответ backend: ${JSON.stringify(createError.response.data, null, 2)}`);
        }
        
        // Проверяем конкретные проблемы
        if (createError.response?.status === 403) {
          console.log('\n🔍 Анализ 403 ошибки:');
          console.log('   - Проверьте, что роль пользователя == "user"');
          console.log('   - Проверьте, что у пользователя есть роль');
          console.log('   - Проверьте backend код в SiteRequestViewSet.create()');
        }
      }
      
    } catch (globalError) {
      console.log(`❌ Глобальная ошибка в тесте создания: ${globalError.message}`);
    }
    
    // 5. Проверка других endpoint-ов
    console.log('\n5. 🧪 Проверка других endpoints:');
    
    // Мои запросы
    try {
      const myRequestsResponse = await api.get('/sites/requests/my_requests/');
      console.log(`✅ Мои запросы: ${myRequestsResponse.data.length} запросов`);
    } catch (error) {
      console.log(`❌ Ошибка "мои запросы": ${error.response?.status}`);
    }
    
    // Pending reviews (ожидается 403)
    try {
      const pendingResponse = await api.get('/sites/requests/pending_reviews/');
      console.log(`⚠️ Неожиданно получен доступ к pending reviews: ${pendingResponse.data.length}`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Корректная 403 ошибка для pending reviews');
      } else {
        console.log(`❌ Неожиданная ошибка pending reviews: ${error.response?.status}`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎯 РАСШИРЕННАЯ ДИАГНОСТИКА ЗАВЕРШЕНА');
    
  } catch (error) {
    console.log('❌ Критическая ошибка диагностики:', error.message);
  }
}

advancedDiagnosis(); 