// Telegram Professional Color System
export const COLORS = {
  // Primary
  primary: '#2AABEE',
  primaryDark: '#229ED9',
  primaryLight: '#6EC6F0',

  // Accent
  online: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',

  // Message Bubbles — Light
  bubbleMe: '#EFFDDE',        // Telegram yashil pufakcha
  bubbleMeText: '#000000',
  bubbleThem: '#FFFFFF',
  bubbleThemText: '#000000',
  bubbleMeTime: '#4DAA57',
  bubbleThemTime: '#999999',

  // Message Bubbles — Dark
  bubbleMeDark: '#2B5278',
  bubbleMeTextDark: '#FFFFFF',
  bubbleThemDark: '#182533',
  bubbleThemTextDark: '#FFFFFF',
  bubbleMeTimeDark: '#6EB4E0',
  bubbleThemTimeDark: '#6D7F8E',

  // Background — Light
  bgLight: '#FFFFFF',
  bgChatLight: '#E8ECEF',
  headerLight: '#FFFFFF',
  inputBgLight: '#F0F2F5',
  separatorLight: '#E5E5EA',

  // Background — Dark
  bgDark: '#0E1621',
  bgChatDark: '#0E1621',
  headerDark: '#17212B',
  inputBgDark: '#242F3D',
  separatorDark: '#1F2936',

  // Text
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#6D7F8E',

  // Avatar Gradient Pairs
  avatarGradients: [
    ['#FF885E', '#FF516A'],  // qizil-to'q sariq
    ['#FFD446', '#FA9F42'],  // sariq
    ['#72D572', '#2BAD4C'],  // yashil
    ['#6EC6F0', '#2AABEE'],  // ko'k
    ['#B48BF2', '#8B66D9'],  // binafsha
    ['#FF79AE', '#FF4081'],  // pushti
    ['#F9A66C', '#E27149'],  // jigar rang
    ['#73DAD4', '#3CB9B2'],  // zangori
  ],
};

// Avatar uchun gradient tanlash (ism asosida)
export function getAvatarColor(name) {
  if (!name) return COLORS.avatarGradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS.avatarGradients[Math.abs(hash) % COLORS.avatarGradients.length];
}

// Ism harflarini olish
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
