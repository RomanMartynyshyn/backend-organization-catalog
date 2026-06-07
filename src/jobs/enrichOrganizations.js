import { prisma } from '../db/prisma.js';
import { getOrganizationByEdrpou } from '../services/taxApi.js';

async function enrichNextOrganization() {
  try {
    // Шукаємо першу організацію, у якої ще немає адреси
    const org = await prisma.organization.findFirst({
      where: { address: null }
    });

    if (!org) {
      console.log('🎉 Всі організації з бази вже оброблені! Більше немає записів без адреси.');
      return false; // Повертаємо false, щоб сигналізувати про завершення
    }

    console.log(`Отримуємо дані з Tax API для ЄДРПОУ: ${org.edrpou} (ID: ${org.id})`);
    
    // Запит до API
    const data = await getOrganizationByEdrpou(org.edrpou);

    if (data && data.FULL_NAME) {
      // API податкової використовує ключі TIN_S, FULL_NAME, ADRESS, C_STAN
      const updatedAddress = data.ADRESS || 'АДРЕСА НЕ ВКАЗАНА';
      
      await prisma.organization.update({
        where: { edrpou: org.edrpou },
        data: {
          name: data.FULL_NAME || org.name,
          address: updatedAddress,
          legalStatus: data.C_STAN || org.legalStatus,
        }
      });
      console.log(`✅ Оновлено компанію: ${data.FULL_NAME}`);
      
    } else {
      // Щоб скрипт не зациклився на одній помилковій компанії, позначаємо її
      await prisma.organization.update({
        where: { edrpou: org.edrpou },
        data: { address: 'ПОМИЛКА_API_АБО_ВІДСУТНЯ' }
      });
      console.log(`❌ Дані не знайдено для ЄДРПОУ: ${org.edrpou}`);
    }
    return true; // Повертаємо true, щоб продовжувати цикл
  } catch (error) {
    console.error('Сталася системна помилка у джобі:', error.message);
    return true; // Навіть при помилці краще спробувати наступну
  }
}

async function startCron() {
  console.log('🚀 Запущено фоновий процес збагачення даних (Tax API)');
  console.log('Ліміт: 1 запит кожні 90 секунд (щоб не перевищити ліміт податкової у 1000 запитів на день)...');
  
  while (true) {
    const hasMore = await enrichNextOrganization();
    
    if (!hasMore) {
      console.log('Роботу повністю завершено. Зупиняю скрипт.');
      process.exit(0); // Зупиняємо програму
    }

    // Затримка між запитами. 
    // Якщо ви хочете швидше — змініть 90000 (90 сек) на, наприклад, 5000 (5 сек)
    await new Promise(resolve => setTimeout(resolve, 90000));
  }
}

// Запуск джоба
startCron();
