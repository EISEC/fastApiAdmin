/**
 * Быстрая проверка доступности backend API
 * Использование: node quick_api_test.js
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000';

async function checkBackend() {
  console.log('🔍 Проверка доступности backend сервера...');
  
  try {
    // Проверка основного endpoint (swagger доступен)
    const healthResponse = await axios.get(`${BASE_URL}/api/v1/swagger/`, { timeout: 5000 });
    console.log('✅ Backend сервер доступен');
    
    // Проверка авторизации
    const authResponse = await axios.post(`${BASE_URL}/api/v1/auth/token/`, {
      email: 'pipka@eisec.ru',
      password: 'Pipi1234'
    });
    
    if (authResponse.data.access) {
      console.log('✅ Авторизация работает');
      console.log('✅ API готов к тестированию');
      
      // Проверка endpoint запросов сайтов
      const token = authResponse.data.access;
      const sitesResponse = await axios.get(`${BASE_URL}/api/v1/sites/requests/available_sites/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Endpoint запросов работает (${sitesResponse.data.length} сайтов)`);
      
      console.log('\n🚀 Все проверки пройдены! Можно запускать полное тестирование.');
      console.log('Команда: node test_site_requests_api.js');
      
    } else {
      console.log('❌ Авторизация не вернула токен');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend сервер недоступен');
      console.log('💡 Запустите: cd ../backend && python3 manage.py runserver 8000');
    } else if (error.response?.status === 401) {
      console.log('❌ Неверные учетные данные');
    } else {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        console.log(`   Статус: ${error.response.status}`);
        console.log(`   Данные: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

checkBackend(); 