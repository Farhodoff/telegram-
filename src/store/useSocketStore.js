import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useChatStore } from './useChatStore';

const SOCKET_URL = 'http://localhost:3000'; // Make sure this matches your backend URL

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token, phone) => {
    // Agar oldindan ulangan bo'lsa, qayta ulanmaymiz
    if (get().socket) {
      console.log('Socket allaqachon mavjud');
      return;
    }

    console.log('Socket.io ulanmoqda...', phone);
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Socket ulandi:', newSocket.id);
      set({ isConnected: true });
      
      // Backend'ga o'zimizni tanitamiz
      newSocket.emit('register_user', { phone, token });
    });

    newSocket.on('receive_message', (data) => {
      console.log('Yangi xabar keldi (Socket):', data);
      // Xabarni mahalliy xotiraga (Zustand) qo'shamiz
      // Hozirgi "Global Echo" orqali u barchaga yoki o'zimizga keladi
      const { chatId, message } = data;
      useChatStore.getState().addMessage(chatId, message);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket uzildi');
      set({ isConnected: false });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (chatId, message, recipientPhone) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      // Backendga jo'natamiz
      socket.emit('send_message', {
        chatId,
        message,
        recipientPhone
      });
      // Biz "Echo" tizimini qilganimiz uchun u qaytib kelgach qo'shiladi. 
      // Yoki avval ekranga chiqarib, keyin statusini o'zgartirishimiz ham mumkin.
      // Lekin hozir mahalliy store'ga ham tezroq qo'shib qo'yamiz (Optimistic UI)
      useChatStore.getState().addMessage(chatId, message);
    } else {
      console.log('Xato: Socket ulanmagan!');
    }
  }
}));
