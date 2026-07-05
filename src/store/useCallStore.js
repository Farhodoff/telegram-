import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCallStore = create(
  persist(
    (set) => ({
      calls: [
        {
          id: '1',
          name: 'Malika R.',
          type: 'missed', // missed, incoming, outgoing
          isVideo: false,
          time: 'Hozirgina',
          date: 'Bugun',
        },
        {
          id: '2',
          name: 'Dostonbek',
          type: 'outgoing',
          isVideo: true,
          time: '14:30',
          date: 'Bugun',
        },
        {
          id: '3',
          name: 'Oila guruh',
          type: 'incoming',
          isVideo: true,
          time: 'Kecha, 20:00',
          date: 'Kecha',
        },
        {
          id: '4',
          name: 'Suhbatdosh',
          type: 'missed',
          isVideo: false,
          time: '12-Mart, 09:15',
          date: 'O\'tgan hafta',
        }
      ],
      addCall: (call) => set((state) => ({ calls: [call, ...state.calls] })),
      clearCalls: () => set({ calls: [] })
    }),
    {
      name: 'telegram-calls-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
