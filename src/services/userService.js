// src/services/userService.js
// Firebase (yoki boshqa backend) bilan ishlash uchun servis

// Agar haqiqiy Firebase ishlatilsa:
// import { doc, updateDoc } from 'firebase/firestore';
// import { db } from '../config/firebase';

export const userService = {
  /**
   * Foydalanuvchining vaqt zonasini (timezone) backendda yangilash
   * @param {string} userId - Foydalanuvchi ID si
   * @param {string} timezone - Yangi vaqt zonasi (masalan, 'Asia/Tashkent')
   * @returns {Promise<boolean>} - Muvaffaqiyatli bajarilsa true qaytaradi
   */
  updateUserTimezone: async (userId, timezone) => {
    try {
      if (!userId) throw new Error("User ID berilmagan");
      
      // Haqiqiy Firebase ulanishi quyidagicha bo'ladi:
      // const userRef = doc(db, 'users', userId);
      // await updateDoc(userRef, { timezone });

      // Hozircha mock (soxta) so'rov:
      console.log(`Backendga yuborildi: User ${userId} uchun timezone ${timezone} qilib o'zgartirildi.`);
      
      // API call simulyatsiyasi (masalan, 500ms kutish)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error("Timezone yangilashda xatolik:", error);
      return false;
    }
  }
};
