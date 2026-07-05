import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockEncrypt, mockDecrypt } from './encryption'; // Need to extract this

export const useChatStore = create(
  persist(
    (set, get) => ({
      chats: {},
      stories: [],
      
      addStory: (uri) => set((state) => ({
        stories: [{ id: Date.now().toString(), uri, time: 'Hozir' }, ...state.stories]
      })),

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

      addMessage: (chatId, message) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;

        let encryptedMessage = { ...message };
        if (encryptedMessage.text) {
          encryptedMessage.text = mockEncrypt(unescape(encodeURIComponent(encryptedMessage.text)));
          encryptedMessage.isEncrypted = true;
        }
        if (encryptedMessage.replyToText) {
          encryptedMessage.replyToText = mockEncrypt(unescape(encodeURIComponent(encryptedMessage.replyToText)));
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

      restoreChats: (backupChats) => set({ chats: backupChats }),

      createNewChat: (contactId, contactName) => set((state) => {
        if (state.chats[contactId]) return state;
        return {
          chats: {
            ...state.chats,
            [contactId]: {
              id: contactId,
              name: contactName,
              folder: 'Shaxsiy',
              secretKey: Date.now().toString(36) + Math.random().toString(36).substring(2),
              timezone: 'Asia/Tashkent', // Default timezone
              messages: []
            }
          }
        };
      }),

      fetchChats: async (token) => {
        try {
          const res = await fetch('http://localhost:3000/api/chats', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.chats) {
            set((state) => {
              const newChats = { ...state.chats };
              data.chats.forEach(c => {
                const chatId = c.contact_id.toString();
                if (!newChats[chatId]) {
                  newChats[chatId] = {
                    id: chatId,
                    name: c.contact_name || c.contact_phone,
                    phone: c.contact_phone,
                    avatar: c.contact_avatar,
                    lastSeen: c.contact_last_seen,
                    folder: 'All',
                    messages: []
                  };
                }
                
                // Add the last message to preview
                if (c.last_msg_id) {
                  const lastMsg = {
                    id: c.last_msg_id.toString(),
                    text: c.last_msg_text,
                    imageUrl: c.last_msg_type === 'image' ? c.last_msg_media : null,
                    videoUrl: c.last_msg_type === 'video' ? c.last_msg_media : null,
                    audioUrl: c.last_msg_type === 'audio' ? c.last_msg_media : null,
                    type: c.last_msg_type,
                    sender: c.last_msg_sender_id.toString() === chatId ? 'them' : 'me',
                    time: new Date(c.last_msg_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isRead: c.unread_count === 0
                  };
                  newChats[chatId].messages = [lastMsg];
                  newChats[chatId].unreadCount = c.unread_count;
                }
              });
              return { chats: newChats };
            });
          }
        } catch (e) {
          console.error('Failed to fetch chats', e);
        }
      },

      fetchMessages: async (token, contactId, isGhostMode) => {
        try {
          const res = await fetch(`http://localhost:3000/api/messages/${contactId}?ghost=${isGhostMode ? 'true' : 'false'}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.messages) {
            set((state) => {
              const chat = state.chats[contactId];
              if (!chat) return state;

              const formattedMessages = data.messages.map(m => ({
                id: m.id.toString(),
                text: m.text,
                imageUrl: m.message_type === 'image' ? m.media_url : null,
                videoUrl: m.message_type === 'video' ? m.media_url : null,
                audioUrl: m.message_type === 'audio' ? m.media_url : null,
                type: m.message_type,
                sender: m.sender_id.toString() === contactId.toString() ? 'them' : 'me',
                time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                isRead: m.is_read
              }));

              return {
                chats: {
                  ...state.chats,
                  [contactId]: {
                    ...chat,
                    messages: formattedMessages
                  }
                }
              };
            });
          }
        } catch (e) {
          console.error('Failed to fetch messages', e);
        }
      },

      editMessage: (chatId, messageId, newText) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        const encryptedNewText = mockEncrypt(unescape(encodeURIComponent(newText)));
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
                  return { ...msg, translatedText: 'O\'zbekcha: ' + msg.text };
                }
                return msg;
              })
            }
          }
        };
      }),

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

      markAsRead: (chatId) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat) return state;
        let changed = false;
        const newMessages = chat.messages.map(msg => {
          if (msg.sender === 'them' && !msg.isRead) {
            changed = true;
            return { ...msg, isRead: true };
          }
          return msg;
        });
        if (!changed) return state;
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              messages: newMessages
            }
          }
        };
      }),

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
                  if (msg.votedByMe !== undefined && msg.votedByMe !== null) return msg;
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
      
      clearAllChats: () => set({ chats: {} })
    }),
    {
      name: 'telegram-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
