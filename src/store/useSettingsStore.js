import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: {
        theme: 'light',
        wallpaper: null,
        biometricEnabled: false,
        ghostModeEnabled: false,
        smartMute: {
          workMode: true,
          sleepMode: false,
          importantContacts: ['MR']
        }
      },
      toggleTheme: () => set((state) => ({
        settings: {
          ...state.settings,
          theme: state.settings.theme === 'light' ? 'dark' : 'light'
        }
      })),
      toggleBiometric: () => set((state) => ({
        settings: { ...state.settings, biometricEnabled: !state.settings.biometricEnabled }
      })),
      toggleGhostMode: () => set((state) => ({
        settings: { ...state.settings, ghostModeEnabled: !state.settings.ghostModeEnabled }
      })),
      setWallpaper: (imageSource) => set((state) => ({
        settings: { ...state.settings, wallpaper: imageSource }
      })),
      toggleSmartMuteMode: (mode) => set((state) => ({
        settings: {
          ...state.settings,
          smartMute: {
            ...state.settings.smartMute,
            [mode]: !state.settings.smartMute[mode]
          }
        }
      })),
      toggleImportantContact: (contactId) => set((state) => {
        const contacts = state.settings.smartMute.importantContacts || [];
        const isImportant = contacts.includes(contactId);
        return {
          settings: {
            ...state.settings,
            smartMute: {
              ...state.settings.smartMute,
              importantContacts: isImportant 
                ? contacts.filter(id => id !== contactId)
                : [...contacts, contactId]
            }
          }
        };
      }),
    }),
    {
      name: 'telegram-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
