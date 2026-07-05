/**
 * MCR-01: Kalit so'zlar ro'yxati (O'zbek tilida)
 * Vaqt yoki reja bilan bog'liq so'zlar
 */
const REMINDER_KEYWORDS = [
  'ertaga',
  'bugun',
  'indinga',
  'soat',
  'uchrashamiz',
  'qong\'iroq',
  'qo\'ng\'iroq',
  'telefon qil',
  'gaplashamiz',
  'eslat',
  'eslatib qo\'y'
];

/**
 * MCR-02 & MCR-08: Xabarda eslatma qo'shish kerakligini tekshirish
 * Regex orqali so'zlar chegarasi (word boundary) bilan tekshiriladi,
 * shunda false-positive (boshqa so'z ichida kelib qolishi) kamayadi.
 * 
 * @param {string} messageText - Chatdagi xabar matni
 * @returns {boolean} - Agar eslatma kerak deb topilsa true qaytaradi
 */
export const detectReminderIntent = (messageText) => {
  if (!messageText || typeof messageText !== 'string') return false;

  const lowerText = messageText.toLowerCase();

  // Matn ichidan kalit so'zlarni qidiramiz
  for (const keyword of REMINDER_KEYWORDS) {
    // \b orqali so'z chegarasini tekshiramiz (MCR-08)
    // O'zbek tilida tutuq belgisi (') bo'lgani uchun regexni moslaymiz
    const regex = new RegExp(`(?:^|\\s|[^a-z0-9])${keyword}(?:$|\\s|[^a-z0-9])`, 'i');
    
    if (regex.test(lowerText)) {
      // Qo'shimcha tekshiruv: "soat" so'zi bo'lsa, yonida raqam bormi?
      if (keyword === 'soat') {
        const hasTime = /\d{1,2}[:\.]?\d{2}|\d{1,2}/.test(lowerText);
        if (hasTime) return true;
        // Agar faqat "soat qancha" deb so'rasa, false qaytaramiz (false-positive oldini olish)
        continue; 
      }
      
      return true;
    }
  }

  return false;
};
