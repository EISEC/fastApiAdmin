/**
 * Проверка существующих pending запросов пользователя
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const TEST_USER = {
  email: 'pipka@eisec.ru',
  password: 'Pipi1234'
};

async function checkExistingRequests() {
  console.log('🔍 ПРОВЕРКА СУЩЕСТВУЮЩИХ PENDING ЗАПРОСОВ');
  console.log('══════════════════════════════════════════════');
  
  try {
    // 1. Авторизация
    console.log('\n1. 🔐 Авторизация...');
    const authResponse = await axios.post(`${BASE_URL}/auth/token/`, TEST_USER);
    const token = authResponse.data.access;
    console.log('✅ Токен получен');
    
    const api = axios.create({
      baseURL: BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Получаем ВСЕ запросы пользователя
    console.log('\n2. 📝 Все запросы пользователя:');
    try {
      const myRequestsResponse = await api.get('/sites/requests/my_requests/');
      const allRequests = myRequestsResponse.data;
      
      console.log(`📊 Всего запросов: ${allRequests.length}`);
      
      if (allRequests.length === 0) {
        console.log('   ✅ У пользователя нет запросов');
      } else {
        allRequests.forEach((req, index) => {
          console.log(`\n   ${index + 1}. 🏠 Сайт: ${req.site_name} (ID: ${req.site})`);
          console.log(`      📊 Статус: ${req.status}`);
          console.log(`      🎯 Роль: ${req.requested_role}`);
          console.log(`      📅 Создан: ${new Date(req.created_at).toLocaleString('ru-RU')}`);
          console.log(`      💬 Сообщение: ${req.message}`);
          
          if (req.status === 'pending') {
            console.log(`      ⚠️ НАЙДЕН PENDING ЗАПРОС! Это может блокировать создание нового!`);
          }
        });
      }
      
      // Проверяем pending запросы отдельно
      const pendingRequests = allRequests.filter(req => req.status === 'pending');
      console.log(`\n📊 Pending запросов: ${pendingRequests.length}`);
      
      if (pendingRequests.length > 0) {
        console.log('\n⚠️ ОБНАРУЖЕНЫ PENDING ЗАПРОСЫ:');
        pendingRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. Сайт "${req.site_name}" - ожидает рассмотрения`);
        });
        
        console.log('\n🔍 АНАЛИЗ ПРОБЛЕМЫ:');
        console.log('   - Согласно constraint в БД, пользователь может иметь только один pending запрос на сайт');
        console.log('   - Если есть pending запросы, новые могут быть заблокированы');
        console.log('   - Попробуйте отменить pending запросы перед созданием новых');
      }
      
    } catch (error) {
      console.log(`❌ Ошибка получения запросов: ${error.response?.status}`);
    }
    
    // 3. Проверяем доступные сайты
    console.log('\n3. 🌐 Доступные сайты для запроса:');
    try {
      const sitesResponse = await api.get('/sites/requests/available_sites/');
      console.log(`✅ Доступных сайтов: ${sitesResponse.data.length}`);
      
      sitesResponse.data.forEach((site, index) => {
        console.log(`   ${index + 1}. 🏠 ${site.name} (ID: ${site.id})`);
      });
      
    } catch (error) {
      console.log(`❌ Ошибка получения доступных сайтов: ${error.response?.status}`);
    }
    
    // 4. Если есть pending запросы, предлагаем их отменить
    const pendingRequests = (await api.get('/sites/requests/my_requests/')).data.filter(req => req.status === 'pending');
    
    if (pendingRequests.length > 0) {
      console.log('\n4. 🗑️ ТЕСТ ОТМЕНЫ PENDING ЗАПРОСА:');
      
      const firstPendingRequest = pendingRequests[0];
      console.log(`   🎯 Отменяем запрос к сайту "${firstPendingRequest.site_name}" (ID: ${firstPendingRequest.id})`);
      
      try {
        await api.delete(`/sites/requests/${firstPendingRequest.id}/cancel_request/`);
        console.log('   ✅ Pending запрос успешно отменен!');
        
        // Теперь пробуем создать новый запрос
        console.log('\n5. 🧪 ТЕСТ СОЗДАНИЯ ПОСЛЕ ОТМЕНЫ:');
        
        const sitesResponse = await api.get('/sites/requests/available_sites/');
        if (sitesResponse.data.length > 0) {
          const testSite = sitesResponse.data[0];
          
          const requestData = {
            site: testSite.id,
            requested_role: 'author',
            message: 'Тест создания после отмены pending запроса'
          };
          
          try {
            const createResponse = await api.post('/sites/requests/', requestData);
            console.log('   ✅ УСПЕХ! Запрос создан после отмены!');
            console.log(`   🆔 ID нового запроса: ${createResponse.data.id}`);
            
            // Отменяем тестовый запрос
            await api.delete(`/sites/requests/${createResponse.data.id}/cancel_request/`);
            console.log('   🗑️ Тестовый запрос отменен');
            
          } catch (createError) {
            console.log('   ❌ Все еще ошибка создания запроса:');
            console.log(`   📊 Статус: ${createError.response?.status}`);
            console.log(`   💬 Сообщение: ${createError.response?.data?.detail || createError.message}`);
          }
        }
        
      } catch (cancelError) {
        console.log(`   ❌ Ошибка отмены запроса: ${cancelError.response?.status}`);
        console.log(`   💬 Сообщение: ${cancelError.response?.data?.detail || cancelError.message}`);
      }
    }
    
    console.log('\n══════════════════════════════════════════════');
    console.log('🎯 ПРОВЕРКА ЗАВЕРШЕНА');
    
  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message);
  }
}

checkExistingRequests(); 