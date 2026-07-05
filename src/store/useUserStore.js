import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: {
    id: null,
    name: '',
    email: '',
    avatar: '',
    timezone: null, 
    isOnline: false,
  },
  
  // Yangi sozlamalar (Theme va Wallpaper)
  settings: {
    theme: 'light', // 'light' yoki 'dark'
    wallpaper: null, // rasm URL yoki require()
  },

  // Chat ma'lumotlari bazasi (2-bosqich)
  chats: {
    chat1: {
      id: 'chat1',
      name: 'Suhbatdosh',
      folder: 'Ish', // 'All', 'Ish', 'Shaxsiy'
      messages: [
        { id: '1', text: 'Salom, yaxshimisiz?', sender: 'them', time: '10:00' },
        { id: '2', text: 'Ertaga soat 15:00 da uchrashamiz', sender: 'them', time: '10:05' }
      ]
    },
    saved: {
      id: 'saved',
      name: 'Saved Messages',
      folder: 'Saved Msgs',
      messages: []
    }
  },
  
  // Foydalanuvchi ma'lumotlarini yangilash
  setUser: (userData) => set({ user: { ...userData } }),
  
  // Faqat timezone'ni yangilash
  updateTimezone: (newTimezone) => set((state) => ({
    user: {
      ...state.user,
      timezone: newTimezone
    }
  })),

  // Theme almashtirish
  toggleTheme: () => set((state) => ({
    settings: {
      ...state.settings,
      theme: state.settings.theme === 'light' ? 'dark' : 'light'
    }
  })),

  // Wallpaper o'zgartirish
  setWallpaper: (imageSource) => set((state) => ({
    settings: {
      ...state.settings,
      wallpaper: imageSource
    }
  })),

  // Xabar qo'shish
  addMessage: (chatId, message) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: [...chat.messages, message]
        }
      }
    };
  }),

  // Xabarni o'chirish
  deleteMessage: (chatId, messageId) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.filter(msg => msg.id !== messageId)
        }
      }
    };
  }),

  // Xabarni tahrirlash
  editMessage: (chatId, messageId, newText) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
          )
        }
      }
    };
  }),

  // Xabarni tarjima qilish (Mock)
  translateMessage: (chatId, messageId) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId && msg.text) {
              // Oddiy mock tarjima
              return { ...msg, translatedText: 'O\'zbekcha: ' + msg.text };
            }
            return msg;
          })
        }
      }
    };
  }),

  // Emojini qo'shish (reaksiya)
  addReaction: (chatId, messageId, reactionEmoji) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId) {
              const reactions = msg.reactions || {};
              const currentCount = reactions[reactionEmoji] || 0;
              return {
                ...msg,
                reactions: {
                  ...reactions,
                  [reactionEmoji]: currentCount + 1
                }
              };
            }
            return msg;
          })
        }
      }
    };
  }),

  // Tizimdan chiqish
  logout: () => set({ 
    user: { id: null, name: '', email: '', avatar: '', timezone: null, isOnline: false },
    settings: { theme: 'light', wallpaper: null },
    chats: {}
  }),
}));
