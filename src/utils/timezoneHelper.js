// src/utils/timezoneHelper.js
import * as Localization from 'expo-localization';

/**
 * Qurilmaning joriy vaqt zonasini avtomatik aniqlash
 * Masalan, 'Asia/Tashkent' yoki 'America/New_York' qaytaradi
 * @returns {string} 
 */
export const getDeviceTimezone = () => {
  try {
    // expo-localization orqali tizimning vaqt zonasini olish
    const calendars = Localization.getCalendars();
    
    // Odatda calendars[0].timeZone bizga kerakli qiymatni beradi
    if (calendars && calendars.length > 0 && calendars[0].timeZone) {
      return calendars[0].timeZone;
    }
    
    // Eski versiyalar uchun fallback
    if (Localization.timezone) {
      return Localization.timezone;
    }

    // Default qiymat (agar aniqlab bo'lmasa)
    return 'UTC';
  } catch (error) {
    console.error('Timezone aniqlashda xatolik:', error);
    return 'UTC';
  }
};
