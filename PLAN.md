# Telegram — Yangi Funksiyalar Roadmap va Task Ro'yxati

## Funksiyalar
1. Timezone Indicator (vaqt zonasi ko'rsatkichi)
2. Message Context Reminder (xabar konteksti bo'yicha eslatma)
3. Smart Reply Suggestions (aqlli javob takliflari)

---

## TECH STACK

### Frontend
- React Native + Expo
- React Navigation (Stack + Tab)
- Zustand (state management)
- AsyncStorage / expo-sqlite
- React Native Paper / NativeBase
- React Native Reanimated
- date-fns-tz

### Backend / Servislar
- Firebase (Firestore + Auth) yoki Node.js + Express + MongoDB
- Firebase Realtime DB yoki Socket.io
- OpenAI API (gpt-4o-mini) yoki Google Gemini API
- Expo Notifications
- Firebase Storage / Cloudinary

### Qo'shimcha kutubxonalar
npm install date-fns date-fns-tz
npm install openai
npm install expo-calendar
npm install expo-localization
npm install @react-native-community/datetimepicker

---

## ROADMAP

### Bosqich 1: Timezone Indicator (2-3 kun)
- Kun 1: User modeliga timezone maydoni qo'shish
- Kun 2: Chat header/profil ekranida vaqt hisoblagich UI
- Kun 3: Status logikasi (uxlayapti/band) + test

### Bosqich 2: Message Context Reminder (4-5 kun)
- Kun 1: Kalit so'zlarni aniqlash logikasi
- Kun 2-3: Kalendar/Reminder integratsiyasi
- Kun 4: UI — "Eslatma qo'shish" tugmasi
- Kun 5: Test va edge case'lar

### Bosqich 3: Smart Reply Suggestions (5-7 kun)
- Kun 1-2: AI API integratsiyasi
- Kun 3: Backend endpoint yaratish
- Kun 4: Frontend so'rov logikasi
- Kun 5: UI — taklif tugmalari
- Kun 6: Caching
- Kun 7: Test, rate-limiting, xatolik boshqaruvi

Umumiy taxminiy vaqt: 2-2.5 hafta

---

## TASK RO'YXATI

### EPIC 1: Timezone Indicator

| ID | Task | Priority |
|---|---|---|
| TZ-01 | User modeliga timezone field qo'shish (backend + DB schema) | High |
| TZ-02 | Ro'yxatdan o'tishda avtomatik timezone aniqlash (expo-localization) | High |
| TZ-03 | Profilga qo'lda timezone/shahar tanlash (settings) | Medium |
| TZ-04 | getLocalTime(timezone) utility funksiyasi yozish | High |
| TZ-05 | Chat header komponentiga timezone badge qo'shish | High |
| TZ-06 | "uxlayapti / band" statusini hisoblash logikasi | Medium |
| TZ-07 | Real-time yangilanish (har daqiqada) | Low |
| TZ-08 | Turli timezone'lar uchun unit test yozish | Medium |

### EPIC 2: Message Context Reminder

| ID | Task | Priority |
|---|---|---|
| MCR-01 | Kalit so'zlar ro'yxatini tuzish (ertaga, soat, uchrashamiz, qo'ng'iroq) | High |
| MCR-02 | detectReminderIntent() funksiyasi (regex asosida) | High |
| MCR-03 | "Eslatma qo'shish" card komponentini yaratish | High |
| MCR-04 | expo-calendar / local notification integratsiyasi | High |
| MCR-05 | Reminder qo'shish modal oynasi (DateTimePicker) | Medium |
| MCR-06 | Reminder'larni saqlash (AsyncStorage yoki backend) | Medium |
| MCR-07 | "Barcha eslatmalarim" ekrani (ixtiyoriy) | Low |
| MCR-08 | False-positive holatlarni kamaytirish | Medium |

### EPIC 3: Smart Reply Suggestions

| ID | Task | Priority |
|---|---|---|
| SR-01 | AI provider tanlash va API key olish | High |
| SR-02 | Backend /api/smart-reply endpoint yaratish | High |
| SR-03 | Prompt engineering (3 ta qisqa javob so'rash) | High |
| SR-04 | Frontend so'rov yuborish logikasi (trigger) | High |
| SR-05 | Suggestion pill tugmalar UI komponenti | High |
| SR-06 | Tugma bosilganda inputga joylashtirish/yuborish | Medium |
| SR-07 | Loading/xatolik holatini boshqarish | Medium |
| SR-08 | Caching (qayta so'rov yubormaslik) | Medium |
| SR-09 | Rate limiting (xarajat nazorati) | Medium |
| SR-10 | Foydalanuvchi tilini aniqlash | Low |

---

## BAJARISH TARTIBI
1. Timezone Indicator — eng oson, tez natija
2. Message Context Reminder — o'rtacha murakkablik
3. Smart Reply Suggestions — eng murakkab (backend + AI)
