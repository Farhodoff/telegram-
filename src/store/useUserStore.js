import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: {
        id: null,
        name: '',
        phone: '',
        email: '',
        avatar: '',
        timezone: null, 
        isOnline: false,
      },
      login: (token, userData) => set({
        isAuthenticated: true,
        token,
        user: { ...userData, id: '1', isOnline: true }
      }),
      setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      updateTimezone: (newTimezone) => set((state) => ({
        user: { ...state.user, timezone: newTimezone }
      })),
      logout: () => set({ 
        isAuthenticated: false,
        token: null,
        user: { id: null, name: '', phone: '', email: '', avatar: '', timezone: null, isOnline: false }
      }),
    }),
    {
      name: 'telegram-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
