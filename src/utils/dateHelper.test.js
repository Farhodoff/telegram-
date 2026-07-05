import { getLocalTime, getStatusIcon } from './dateHelper';

describe('dateHelper utilities', () => {
  // Test qilish uchun tizim vaqtini "MOCK" qilamiz
  beforeAll(() => {
    jest.useFakeTimers('modern');
    // Aytaylik, hozir UTC bo'yicha 2023-10-01T12:00:00Z (Tushki soat 12)
    jest.setSystemTime(new Date('2023-10-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('getLocalTime()', () => {
    it('Toshkent vaqti uchun to\'g\'ri format qaytaradi (UTC+5)', () => {
      // 12:00 UTC -> 17:00 Toshkent
      const time = getLocalTime('Asia/Tashkent');
      expect(time).toBe('17:00');
    });

    it('Nyu-York vaqti uchun to\'g\'ri format qaytaradi (EST/EDT, masalan UTC-4)', () => {
      // 12:00 UTC -> 08:00 Nyu-York (Yozgi vaqtda)
      const time = getLocalTime('America/New_York');
      expect(time).toBe('08:00');
    });

    it('Noto\'g\'ri timezone berilganda bo\'sh string qaytaradi', () => {
      const time = getLocalTime('Invalid/Timezone');
      expect(time).toBe('');
    });
  });

  describe('getStatusIcon()', () => {
    it('Kunduzgi vaqtlarda (07:00 dan 22:59 gacha) quyosh (☀️) qaytaradi', () => {
      expect(getStatusIcon('17:00')).toBe('☀️');
      expect(getStatusIcon('08:30')).toBe('☀️');
      expect(getStatusIcon('12:15')).toBe('☀️');
      expect(getStatusIcon('22:59')).toBe('☀️');
    });

    it('Tungi vaqtlarda (23:00 dan 06:59 gacha) oy (🌙) qaytaradi', () => {
      expect(getStatusIcon('23:00')).toBe('🌙');
      expect(getStatusIcon('02:45')).toBe('🌙');
      expect(getStatusIcon('06:59')).toBe('🌙');
    });

    it('Bo\'sh qiymat berilganda bo\'sh string qaytaradi', () => {
      expect(getStatusIcon('')).toBe('');
      expect(getStatusIcon(null)).toBe('');
    });
  });
});
