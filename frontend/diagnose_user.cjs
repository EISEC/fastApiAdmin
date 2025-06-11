/**
 * Диагностика пользователя и его прав доступа
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const TEST_USER = {
  email: 'pipka@eisec.ru',
  password: 'Pipi1234'
};

async function diagnoseUser() {
  console.log('🔍 ДИАГНОСТИКА ПОЛЬЗОВАТЕЛЯ pipka@eisec.ru');
  console.log('═══════════════════════════════════════════════');
  
  try {
    // 1. Авторизация
    console.log('\n1. Авторизация...');
    const authResponse = await axios.post(`${BASE_URL}/auth/token/`, TEST_USER);
    const token = authResponse.data.access;
    console.log('✅ Токен получен');
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Информация о пользователе
    console.log('\n2. Информация о текущем пользователе:');
    try {
      const userResponse = await api.get('/auth/me/');
      console.log('✅ Данные пользователя получены:');
      console.log(`   📧 Email: ${userResponse.data.email}`);
      console.log(`   👤 Имя: ${userResponse.data.first_name} ${userResponse.data.last_name}`);
      console.log(`   🆔 ID: ${userResponse.data.id}`);
      console.log(`   🔒 Роль: ${userResponse.data.role?.name || 'НЕ УСТАНОВЛЕНА'} (ID: ${userResponse.data.role?.id || 'НЕТ'})`);
      console.log(`   ✅ Активен: ${userResponse.data.is_active}`);
      console.log(`   🛡️ Суперпользователь: ${userResponse.data.is_superuser}`);
      console.log(`   📊 Персонал: ${userResponse.data.is_staff}`);
    } catch (error) {
      console.log('❌ Ошибка получения данных пользователя:', error.response?.status);
    }
    
    // 3. Доступные роли
    console.log('\n3. Доступные роли в системе:');
    try {
      const rolesResponse = await api.get('/auth/roles/');
      console.log('✅ Роли загружены:');
      rolesResponse.data.forEach(role => {
        console.log(`   🏷️ ${role.name} (ID: ${role.id}) - ${role.description}`);
      });
    } catch (error) {
      console.log('❌ Ошибка получения ролей:', error.response?.status);
    }
    
    // 4. Проверка прав на создание запросов
    console.log('\n4. Тест создания запроса:');
    try {
      const sitesResponse = await api.get('/sites/requests/available_sites/');
      console.log(`✅ Доступно сайтов: ${sitesResponse.data.length}`);
      
      if (sitesResponse.data.length > 0) {
        const testSite = sitesResponse.data[0];
        console.log(`📍 Тестовый сайт: ${testSite.name} (ID: ${testSite.id})`);
        
        const requestData = {
          site: testSite.id,
          requested_role: 'author',
          message: 'Диагностический тест создания запроса'
        };
        
        const createResponse = await api.post('/sites/requests/', requestData);
        console.log('✅ Запрос успешно создан!');
        console.log(`   🆔 ID запроса: ${createResponse.data.id}`);
        console.log(`   📊 Статус: ${createResponse.data.status}`);
        
        // Отменим тестовый запрос
        try {
          await api.post(`/sites/requests/${createResponse.data.id}/cancel_request/`);
          console.log('✅ Тестовый запрос отменен');
        } catch (e) {
          console.log('⚠️ Не удалось отменить тестовый запрос');
        }
        
      } else {
        console.log('⚠️ Нет доступных сайтов для тестирования');
      }
      
    } catch (error) {
      console.log('❌ Ошибка создания запроса:');
      console.log(`   📊 Статус: ${error.response?.status}`);
      console.log(`   💬 Сообщение: ${error.response?.data?.detail || error.message}`);
      
      if (error.response?.data && typeof error.response.data === 'object') {
        console.log('   📝 Детали ошибки:');
        Object.entries(error.response.data).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            errors.forEach(err => console.log(`     - ${field}: ${err}`));
          } else {
            console.log(`     - ${field}: ${errors}`);
          }
        });
      }
    }
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎯 ДИАГНОСТИКА ЗАВЕРШЕНА');
    
  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message);
  }
}

diagnoseUser(); 