import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export const useUserStore = create(
  persist(
    (set) => ({
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
      wallpaper: null,
      secretKey: 'default_secret_key', // E2EE
      messages: [
        { id: '1', text: 'Salom, yaxshimisiz?', sender: 'them', time: '10:00' },
        { id: '2', text: 'Ertaga soat 15:00 da uchrashamiz', sender: 'them', time: '10:05' }
      ]
    },
    saved: {
      id: 'saved',
      name: 'Saved Messages',
      folder: 'Saved Msgs',
      wallpaper: null,
      secretKey: 'saved_secret_key', // E2EE
      messages: []
    }
  },

  // Stories (Tarixchalar)
  stories: [],
  addStory: (uri) => set((state) => ({
    stories: [{ id: Date.now().toString(), uri, time: 'Hozir' }, ...state.stories]
  })),

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

  // Biometrik qulfni o'zgartirish
  toggleBiometric: () => set((state) => ({
    settings: { ...state.settings, biometricEnabled: !state.settings.biometricEnabled }
  })),

  // Umumiy App Wallpaper o'zgartirish
  setWallpaper: (imageSource) => set((state) => ({
    settings: {
      ...state.settings,
      wallpaper: imageSource
    }
  })),

  // Chat Wallpaper o'zgartirish
  setChatWallpaper: (chatId, imageSource) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          wallpaper: imageSource
        }
      }
    };
  }),

  // Xabar qo'shish
  addMessage: (chatId, message) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;

    // E2EE Shifrlash
    const secretKey = chat.secretKey || 'fallback_key';
    let encryptedMessage = { ...message };
    
    if (encryptedMessage.text) {
      encryptedMessage.text = CryptoJS.AES.encrypt(encryptedMessage.text, secretKey).toString();
      encryptedMessage.isEncrypted = true;
    }
    
    if (encryptedMessage.replyToText) {
      encryptedMessage.replyToText = CryptoJS.AES.encrypt(encryptedMessage.replyToText, secretKey).toString();
    }

    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: [...chat.messages, encryptedMessage]
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

  // Chatlarni tiklash (Restore)
  restoreChats: (backupChats) => set({ chats: backupChats }),

  // Yangi chat yaratish (Kontaktlar orqali)
  createNewChat: (contactId, contactName) => set((state) => {
    if (state.chats[contactId]) return state; // Agar oldin yozishilgan bo'lsa
    return {
      chats: {
        ...state.chats,
        [contactId]: {
          id: contactId,
          name: contactName,
          folder: 'Shaxsiy',
          secretKey: CryptoJS.lib.WordArray.random(128/8).toString(),
          messages: []
        }
      }
    };
  }),

  // Xabarni tahrirlash
  editMessage: (chatId, messageId, newText) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;

    const secretKey = chat.secretKey || 'fallback_key';
    const encryptedNewText = CryptoJS.AES.encrypt(newText, secretKey).toString();

    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, text: encryptedNewText, isEdited: true, isEncrypted: true } : msg
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

  // 1 marta ko'riladigan rasmni o'qilgan qilish
  markAsViewed: (chatId, messageId) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, isViewed: true } : msg
          )
        }
      }
    };
  }),

  // So'rovnomaga ovoz berish
  votePoll: (chatId, messageId, optionIndex) => set((state) => {
    const chat = state.chats[chatId];
    if (!chat) return state;
    return {
      chats: {
        ...state.chats,
        [chatId]: {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId && msg.type === 'poll') {
              if (msg.votedByMe !== undefined && msg.votedByMe !== null) return msg; // Faqat bir marta ovoz berish mumkin
              const newOptions = [...msg.options];
              newOptions[optionIndex].votes += 1;
              return { ...msg, options: newOptions, votedByMe: optionIndex };
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
    }),
    {
      name: 'telegram-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
