/**
 * AI bilan ishlash uchun xizmat (Mock qilingan)
 * Aslida bu so'rov backend orqali (Node.js/Express) OpenAI API'ga yuborilishi kerak.
 * API Key'larni to'g'ridan-to'g'ri React Native kodida qoldirish xavfli.
 */

// Agar OpenAI ishlatilsa (backend da):
/*
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
*/

export const aiService = {
  /**
   * Kelgan xabarga qarab 3 ta qisqa javob variantini qaytaradi
   * @param {string} incomingMessage - Foydalanuvchiga kelgan xabar
   * @returns {Promise<string[]>} - 3 ta qisqa javob ro'yxati
   */
  getSmartReplies: async (incomingMessage) => {
    if (!incomingMessage || incomingMessage.length < 2) return [];

    try {
      // SR-03: Prompt Engineering (Backend da qilinadigan ish)
      const prompt = `
        Sen Telegram messenjerida "Smart Reply" (Aqlli javob) yordamchisisan.
        Foydalanuvchiga quyidagi xabar keldi: "${incomingMessage}"
        Iltimos, shu xabarga mos tushadigan, O'zbek tilida 3 ta juda qisqa (1-3 so'zdan iborat) javob variantlarini yoz.
        Javoblar oddiy, so'zlashuv uslubida va massiv ko'rinishida bo'lsin.
      `;

      console.log("AI ga yuborilayotgan prompt:", prompt);

      // Simulyatsiya (Tarmoq so'rovini kutish)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Hozircha mock javoblar qaytaramiz (keyword asosida)
      const lower = incomingMessage.toLowerCase();
      
      if (lower.includes('salom') || lower.includes('qalay')) {
        return ["Salom!", "Yaxshi, o'zingizchi?", "Assalomu alaykum"];
      } else if (lower.includes('qachon') || lower.includes('soat')) {
        return ["Tez orada", "Bilmadim", "Keyinroq aytaman"];
      } else if (lower.includes('rahmat')) {
        return ["Arzimaydi", "Sog' bo'ling", "Xursandman"];
      }

      // Default javoblar
      return ["Ha, albatta", "Bilmayman", "Keyinroq gaplashamiz"];
      
    } catch (error) {
      console.error("AI so'rovida xatolik:", error);
      return [];
    }
  }
};
