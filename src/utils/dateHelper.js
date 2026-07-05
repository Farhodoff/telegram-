import { format, toZonedTime } from 'date-fns-tz';

/**
 * Berilgan timezone uchun joriy mahalliy vaqtni 'HH:mm' formatida qaytaradi
 * @param {string} timezone - Vaqt zonasi (masalan, 'Asia/Tashkent')
 * @returns {string} - Formatlangan vaqt (masalan, '03:24')
 */
export const getLocalTime = (timezone) => {
  if (!timezone) return '';
  
  try {
    const date = new Date();
    // UTC vaqtni berilgan timezone'ga o'tkazish
    const zonedDate = toZonedTime(date, timezone);
    // Vaqtni 'HH:mm' formatida qaytarish
    return format(zonedDate, 'HH:mm', { timeZone: timezone });
  } catch (error) {
    console.error("Vaqtni formatlashda xatolik:", error);
    return '';
  }
};

/**
 * Mahalliy vaqtga qarab foydalanuvchi statusini (uxlayapti/faol) aniqlaydi
 * @param {string} localTime - 'HH:mm' formatidagi vaqt string
 * @returns {string} - Emoji ikonkasi (🌙 yoki ☀️)
 */
export const getStatusIcon = (localTime) => {
  if (!localTime) return '';
  
  const [hourStr] = localTime.split(':');
  const hour = parseInt(hourStr, 10);
  
  // 23:00 dan 07:00 gacha uxlayapti (🌙)
  if (hour >= 23 || hour < 7) {
    return '🌙'; // uxlayotgan / tun
  }
  return '☀️'; // faol / kunduz
};
