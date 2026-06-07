import axios from 'axios';

// Рекомендую винести TOKEN в .env файл
const TOKEN = process.env.TAX_API_TOKEN || 'твой_токен';

export async function getOrganizationByEdrpou(edrpou) {
  try {
    const response = await axios.post(
      'https://cabinet.tax.gov.ua/ws/api/public/registers/registration',
      { tins: edrpou, token: TOKEN },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    // В API податкової результат може повертатися масивом або об'єктом.
    // Припускаємо, що це об'єкт з масивом items або щось подібне (залежно від їхньої документації).
    // Повертаємо перший елемент масиву, або сам response.data
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(`Помилка API податкової для ЄДРПОУ ${edrpou}:`, error.response.data);
    } else {
      console.error(`Помилка API податкової для ЄДРПОУ ${edrpou}:`, error.message);
    }
    return null;
  }
}
