// ============================================================
// ТЕСТОВЫЙ СКРИПТ ДЛЯ ПРОВЕРКИ КОММЕНТАРИЕВ И СЕССИИ
// Вставьте этот код в консоль браузера (F12 -> Console)
// ============================================================

// Функция 1: Вывести состояние всех localStorage ключей
function checkLocalStorage() {
  console.log('=== LOCAL STORAGE СОСТОЯНИЕ ===');
  
  const market_user = localStorage.getItem('market_user');
  const market_reviews = localStorage.getItem('market_reviews');
  const cart = localStorage.getItem('cart');
  const theme = localStorage.getItem('theme');
  
  console.log('📦 market_user:', market_user ? 'ЕСТЬ (' + (market_user.length) + ' символов)' : 'ОТСУТСТВУЕТ');
  if (market_user) {
    try {
      const user = JSON.parse(market_user);
      console.log('   - username:', user.username);
      console.log('   - objectId:', user.objectId);
      console.log('   - sessionToken:', user.sessionToken ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ');
    } catch (e) {
      console.error('   - Ошибка парсинга:', e);
    }
  }
  
  console.log('💬 market_reviews:', market_reviews ? 'ЕСТЬ (' + (market_reviews.length) + ' символов)' : 'ОТСУТСТВУЕТ');
  if (market_reviews) {
    try {
      const reviews = JSON.parse(market_reviews);
      console.log('   - Количество отзывов:', reviews.length);
      reviews.forEach((r, i) => {
        console.log(`   [${i}] productId: ${r.productId}, userName: ${r.userName}, rating: ${r.rating}, comment: "${r.comment.substring(0, 50)}..."`);
      });
    } catch (e) {
      console.error('   - Ошибка парсинга:', e);
    }
  }
  
  console.log('🛒 cart:', cart ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ');
  console.log('🎨 theme:', theme || 'ОТСУТСТВУЕТ');
}

// Функция 2: Добавить тестовый комментарий в localStorage
function addTestReview() {
  console.log('=== ДОБАВЛЕНИЕ ТЕСТОВОГО КОММЕНТАРИЯ ===');
  
  const market_reviews = localStorage.getItem('market_reviews');
  let reviews = [];
  
  if (market_reviews) {
    try {
      reviews = JSON.parse(market_reviews);
    } catch (e) {
      console.error('Ошибка парсинга существующих отзывов:', e);
    }
  }
  
  const testReview = {
    id: Date.now().toString(),
    productId: 'test-product-' + Date.now(),
    userId: 'test-user',
    userName: 'Тестовый пользователь',
    rating: 5,
    comment: `ТЕСТ КОММЕНТАРИЯ от ${new Date().toLocaleString('ru-RU')}`,
    date: new Date().toLocaleDateString('ru-RU')
  };
  
  reviews.push(testReview);
  localStorage.setItem('market_reviews', JSON.stringify(reviews));
  
  console.log('✅ Тестовый комментарий добавлен:', testReview);
  console.log('📊 Всего комментариев: ' + reviews.length);
}

// Функция 3: Очистить все localStorage (для полного reset)
function clearAllData() {
  console.log('=== ОЧИСТКА ВСЕХ ДАННЫХ ===');
  const keys = ['market_user', 'market_reviews', 'cart', 'theme'];
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log('❌ Удален: ' + key);
  });
}

// Функция 4: Показать состояние Parse
async function checkParseState() {
  console.log('=== PARSE SDK СОСТОЯНИЕ ===');
  
  try {
    const Parse = window.Parse || (await import('parse'));
    const user = Parse.User.current();
    
    if (user) {
      console.log('✅ Текущий пользователь в Parse:', {
        username: user.username,
        email: user.email,
        objectId: user.objectId,
        sessionToken: user.getSessionToken() ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'
      });
    } else {
      console.log('❌ Нет текущего пользователя в Parse');
    }
  } catch (e) {
    console.error('❌ Ошибка при проверке Parse:', e);
  }
}

// Функция 5: Сравнить localStorage ДО и ПОСЛЕ F5 (для отслеживания)
function saveCheckpoint(label = 'CHECKPOINT') {
  console.log(`=== ${label} ===`);
  const checkpoint = {
    timestamp: new Date().toISOString(),
    market_user: localStorage.getItem('market_user'),
    market_reviews: localStorage.getItem('market_reviews'),
    cart: localStorage.getItem('cart')
  };
  
  // Сохранить в sessionStorage для сравнения (sessionStorage очищается при закрытии вкладки)
  sessionStorage.setItem('checkpoint_' + Date.now(), JSON.stringify(checkpoint));
  
  console.log('💾 Checkpoint сохранён:', checkpoint);
  return checkpoint;
}

// ============================================================
// ИСПОЛЬЗОВАНИЕ:
// ============================================================
console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ТЕСТОВЫЙ СКРИПТ ДЛЯ ПРОВЕРКИ КОММЕНТАРИЕВ            ║
╚════════════════════════════════════════════════════════════════╝

КОМАНДЫ:

1️⃣  checkLocalStorage()  
    → Вывести состояние всех ключей localStorage
    
2️⃣  checkParseState()    
    → Проверить состояние Parse SDK и текущего пользователя
    
3️⃣  addTestReview()      
    → Добавить тестовый комментарий в localStorage (для отладки)
    
4️⃣  saveCheckpoint('LABEL')
    → Сохранить checkpoint состояния (для сравнения после F5)
    
5️⃣  clearAllData()       
    → ОПАСНО: Очистить все localStorage (для полного reset)

РЕКОМЕНДУЕМЫЙ ПОРЯДОК ТЕСТА:

1. saveCheckpoint('ДО ВХОДА')
2. [Введите логин Vladikabh23 / 111111 и войдите]
3. saveCheckpoint('ПОСЛЕ ВХОДА')
4. checkLocalStorage()
5. [Найдите товар и добавьте комментарий]
6. checkLocalStorage()
7. saveCheckpoint('ПОСЛЕ ДОБАВЛЕНИЯ КОММЕНТАРИЯ')
8. [Нажмите F5]
9. checkLocalStorage()
10. saveCheckpoint('ПОСЛЕ F5')
11. checkParseState()

✨ Если market_reviews после F5 содержит ваш комментарий → ТЕС ПРОЙДЕН ✅

`);

// Автоматически выполнить первую проверку
console.log('Выполняю начальную проверку...');
checkLocalStorage();
