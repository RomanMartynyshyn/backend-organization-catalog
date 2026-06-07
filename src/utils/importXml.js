import fs from 'fs';
import sax from 'sax';
import { prisma } from '../db/prisma.js';

// Функція для перевірки, чи назва містить згадку про Кривий Ріг
function isKryvyiRih(name) {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  
  const variations = [
    'кривий ріг',
    'криворізьк'
  ];

  return variations.some(variation => lowerName.includes(variation));
}

export async function parseBigXML(filePath) {
  return new Promise((resolve, reject) => {
    const saxStream = sax.createStream(true, { trim: true, normalize: true });
    
    let currentOrg = null;
    let batch = [];
    const BATCH_SIZE = 500;
    const fileStream = fs.createReadStream(filePath);
    
    let activeText = '';
    
    let isProcessing = false;
    let batchQueue = [];
    let parsedCount = 0; // Додаємо лічильник для індикації прогресу

    async function processQueue() {
      if (isProcessing) return;
      isProcessing = true;
      fileStream.pause(); // Ставимо парсер на паузу, доки обробляємо чергу

      while (batchQueue.length > 0) {
        const currentBatch = batchQueue.shift();
        await saveBatchToDB(currentBatch);
      }

      isProcessing = false;
      fileStream.resume(); // Відновлюємо після збереження всіх накопичених пачок
    }

    saxStream.on('opentag', (node) => {
      activeText = ''; // Скидаємо накопичений текст при відкритті нового тегу
      
      if (node.name === 'SUBJECT') {
        parsedCount++;
        if (parsedCount % 50000 === 0) {
          console.log(`...проаналізовано ${parsedCount} організацій у файлі (Знайдено криворізьких: ${batchQueue.length * BATCH_SIZE + batch.length} нових)`);
        }
        currentOrg = { 
          edrpou: '', name: '', address: '', status: '', founders: [], 
          directors: [], opf: '', regDate: '', shortName: '' 
        };
      }
    });

    saxStream.on('text', (text) => {
      if (!currentOrg) return;
      activeText += text; // Накопичуємо текст (бо sax може розбивати його на шматки)
    });

    saxStream.on('closetag', (tagName) => {
      if (!currentOrg) return;

      // Коли тег закривається, записуємо накопичений текст у відповідне поле
      switch (tagName) {
        case 'EDRPOU': currentOrg.edrpou = activeText.trim(); break;
        case 'NAME': currentOrg.name = activeText.trim(); break;
        case 'STAN': currentOrg.status = activeText.trim(); break;
        case 'ADDRESS': currentOrg.address = activeText.trim(); break;
        case 'FOUNDER': 
          if (activeText.trim()) currentOrg.founders.push(activeText.trim()); 
          break;
        case 'SIGNER':
          if (activeText.trim()) currentOrg.directors.push(activeText.trim());
          break;
        case 'OPF': currentOrg.opf = activeText.trim(); break;
        case 'REGISTRATION': currentOrg.regDate = activeText.trim(); break;
        case 'SHORT_NAME': currentOrg.shortName = activeText.trim(); break;
      }
      activeText = ''; // Скидаємо після запису

      if (tagName === 'SUBJECT') {
        if (currentOrg.edrpou && isKryvyiRih(currentOrg.name)) {
          batch.push({
            edrpou: currentOrg.edrpou,
            name: currentOrg.name,
            address: currentOrg.address || null, // якщо адрес немає, буде null
            legalStatus: currentOrg.status,
            founders: currentOrg.founders.join('\n'),
            director: currentOrg.directors.join('\n') || null,
            organizationType: currentOrg.opf || null,
            registrationDate: currentOrg.regDate || null,
            shortName: currentOrg.shortName || null
          });
        }
        currentOrg = null;

        if (batch.length >= BATCH_SIZE) {
          batchQueue.push(batch);
          batch = [];
          processQueue(); // Запускаємо обробку черги (вона не блокує цей синхронний обробник)
        }
      }
    });

    saxStream.on('end', async () => {
      if (batch.length > 0) {
        batchQueue.push(batch);
      }
      
      // Чекаємо, доки завершиться обробка всіх елементів у черзі
      while (isProcessing || batchQueue.length > 0) {
        await new Promise(r => setTimeout(r, 100));
      }

      console.log('Парсинг та імпорт завершено успішно!');
      resolve();
    });

    saxStream.on('error', (err) => {
      console.error('Помилка парсингу XML:', err);
      reject(err);
    });

    fileStream.pipe(saxStream);
  });
}

async function saveBatchToDB(organizations) {
  let successCount = 0;
  for (const org of organizations) {
    try {
      await prisma.organization.upsert({
        where: { edrpou: org.edrpou },
        update: {
          name: org.name,
          legalStatus: org.legalStatus,
          founders: org.founders,
          director: org.director,
          organizationType: org.organizationType,
          registrationDate: org.registrationDate,
          shortName: org.shortName
          // address не оновлюємо, якщо він порожній, бо ми його отримуватимемо з API
        },
        create: {
          edrpou: org.edrpou,
          name: org.name,
          address: org.address,
          legalStatus: org.legalStatus,
          founders: org.founders,
          director: org.director,
          organizationType: org.organizationType,
          registrationDate: org.registrationDate,
          shortName: org.shortName
        }
      });
      successCount++;
    } catch (err) {
      console.error(`Помилка збереження для ${org.edrpou}:`, err.message);
    }
  }
  console.log(`Успішно збережено/оновлено ${successCount} з ${organizations.length} організацій у цій пачці.`);
}

if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === import.meta.filename) {
  const filePath = process.argv[2] || './registry_uo.xml';
  if (!fs.existsSync(filePath)) {
    console.error(`Файл ${filePath} не знайдено! Вкажіть правильний шлях: node src/utils/importXml.js <шлях_до_файлу>`);
    process.exit(1);
  }
  parseBigXML(filePath)
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
