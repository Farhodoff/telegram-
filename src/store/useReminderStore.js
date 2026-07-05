import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useReminderStore = create(
  persist(
    (set) => ({
      reminders: [],
      addReminder: (reminder) => set((state) => ({
        reminders: [...state.reminders, reminder]
      })),
      removeReminder: (id) => set((state) => ({
        reminders: state.reminders.filter(r => r.id !== id)
      })),
    }),
    {
      name: 'telegram-reminder-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
