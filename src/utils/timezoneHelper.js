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

/**
 * Berilgan timezone (masalan, 'America/New_York') bo'yicha mahalliy vaqtni va
 * uxlash holatini (23:00 dan 07:00 gacha) aniqlaydi.
 * @param {string} timezone 
 * @returns {{ timeString: string, isSleeping: boolean }}
 */
export const getRemoteTimeInfo = (timezone) => {
  if (!timezone) return null;
  
  try {
    // Joriy vaqtni kiritilgan timezone bo'yicha formatlash
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24 soatlik format
    });
    
    // Natija "HH:MM" ko'rinishida bo'ladi
    const timeString = formatter.format(date);
    
    // Soat qismini ajratib olish (masalan "23:45" dan 23)
    const hour = parseInt(timeString.split(':')[0], 10);
    
    // Uxlash holati 23:00 dan 07:00 gacha
    const isSleeping = hour >= 23 || hour < 7;
    
    return {
      timeString,
      isSleeping
    };
  } catch (error) {
    console.warn(`Timezone xatoligi (${timezone}):`, error);
    return null;
  }
};
