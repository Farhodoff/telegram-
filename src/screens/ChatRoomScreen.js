import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground, Modal, Alert } from 'react-native';
import { TimezoneSelector } from '../components/settings/TimezoneSelector';
import { TimezoneBadge } from '../components/chat/TimezoneBadge';
import { ReminderCard } from '../components/chat/ReminderCard';
import { SmartReplySuggestions } from '../components/chat/SmartReplySuggestions';
import { detectReminderIntent } from '../utils/reminderHelper';
import { useUserStore } from '../store/useUserStore';

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, chatName } = route.params;
  const { user, settings, chats, addMessage, deleteMessage, editMessage, addReaction, setWallpaper } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const currentChat = chats[chatId] || { messages: [] };
  const messages = currentChat.messages;

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Tahrirlash (Edit) holati
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Long-press menyusi (ActionSheet modal simulyatsiyasi)
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Reaction picker holati
  const [reactionMessage, setReactionMessage] = useState(null);

  // Qidiruv holati (3-bosqich)
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      if (editingMessage) {
        // Tahrirlash
        editMessage(chatId, editingMessage.id, inputText);
        setEditingMessage(null);
      } else {
        // Yangi xabar
        const newMessage = { 
          id: Date.now().toString(), 
          text: inputText, 
          sender: 'me', 
          time: 'Hozir',
          replyTo: replyingTo ? replyingTo.id : null,
          replyToText: replyingTo ? replyingTo.text : null,
          replyToSender: replyingTo ? replyingTo.sender : null,
          reactions: {}
        };
        addMessage(chatId, newMessage);
      }
      setInputText('');
      setReplyingTo(null);
    }
  };

  const handleAction = (action) => {
    if (!selectedMessage) return;
    
    switch (action) {
      case 'reply':
        setReplyingTo(selectedMessage);
        break;
      case 'edit':
        if (selectedMessage.sender === 'me') {
          setEditingMessage(selectedMessage);
          setInputText(selectedMessage.text);
        }
        break;
      case 'delete':
        deleteMessage(chatId, selectedMessage.id);
        break;
      case 'react':
        setReactionMessage(selectedMessage);
        break;
    }
    setSelectedMessage(null);
  };

  const handleReaction = (emoji) => {
    if (reactionMessage) {
      addReaction(chatId, reactionMessage.id, emoji);
      setReactionMessage(null);
    }
  };

  const lastIncomingMessage = messages.filter(m => m.sender === 'them').pop();

  // Qidiruv filtri
  const displayMessages = messages.filter(msg => 
    isSearching && searchQuery.trim() !== '' 
      ? msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 8, marginLeft: -8}}>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>‹ Ortga</Text>
          </TouchableOpacity>
          
          {isSearching ? (
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Qidiruv..."
              placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          ) : (
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>{chatName}</Text>
          )}

          <TouchableOpacity onPress={() => { setIsSearching(!isSearching); setSearchQuery(''); }} style={{padding: 8}}>
            <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>{isSearching ? '✕' : '🔍'}</Text>
          </TouchableOpacity>
        </View>
        {!isSearching && (
          <View style={styles.headerControls}>
            <TimezoneSelector />
            <TouchableOpacity 
              style={styles.wallpaperBtn} 
              onPress={() => setWallpaper(settings.wallpaper ? null : 'https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')}
            >
              <Text style={styles.wallpaperBtnText}>{settings.wallpaper ? 'Fonni o\'chirish' : 'Fonni o\'zgartirish'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Chat Area */}
      <ImageBackground 
        source={settings.wallpaper ? { uri: settings.wallpaper } : null} 
        style={[styles.chatArea, isDark && !settings.wallpaper ? styles.chatAreaDark : null]}
        imageStyle={{ opacity: isDark ? 0.5 : 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Chat header'dagi timezone badge */}
        {chatId !== 'saved' && (
          <View style={styles.chatProfileHeader}>
            <Text style={[styles.chatName, isDark && styles.textDark, settings.wallpaper && {color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4}]}>{chatName}</Text>
            <TimezoneBadge timezone={user.timezone || 'Asia/Tashkent'} isDarkMode={isDark} />
          </View>
        )}

        {displayMessages.map(msg => {
          const isThem = msg.sender === 'them';
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          
          return (
            <View key={msg.id} style={{ marginBottom: 16 }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onLongPress={() => setSelectedMessage(msg)}
                delayLongPress={300}
                style={[styles.bubble, isThem ? (isDark ? styles.bubbleThemDark : styles.bubbleThem) : styles.bubbleMe]}
              >
                {/* Reply info ko'rsatish */}
                {msg.replyToText && (
                  <View style={[styles.replyBoxInBubble, isThem ? (isDark ? styles.replyBoxThemDark : styles.replyBoxThem) : styles.replyBoxMe]}>
                    <Text style={[styles.replySenderInBubble, isThem ? styles.replySenderThem : styles.replySenderMe]}>
                      {msg.replyToSender === 'me' ? 'Siz' : 'Suhbatdosh'}
                    </Text>
                    <Text numberOfLines={1} style={[styles.replyTextInBubble, isThem ? (isDark ? styles.textDark : {color: '#000'}) : styles.textMe]}>
                      {msg.replyToText}
                    </Text>
                  </View>
                )}
                <Text style={isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe}>{msg.text}</Text>
                
                {/* Vaqt va Edit status */}
                <View style={styles.timeRow}>
                  {msg.isEdited && <Text style={[styles.editedText, isThem ? null : {color: '#E0E0E0'}]}>edited </Text>}
                  <Text style={[styles.msgTime, isThem ? (isDark ? {color: '#888'} : null) : {color: '#E0E0E0'}]}>{msg.time}</Text>
                </View>

                {/* Emojilar ko'rsatkichi */}
                {hasReactions && (
                  <View style={styles.reactionsContainer}>
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <View key={emoji} style={styles.reactionBadge}>
                        <Text style={styles.reactionText}>{emoji} {count > 1 ? count : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Eslatma qo'shish kartasi (MCR) */}
              {isThem && detectReminderIntent(msg.text) && (
                <ReminderCard 
                  messageText={msg.text} 
                  onDismiss={() => {}} 
                />
              )}
            </View>
          );
        })}
        </ScrollView>
      </ImageBackground>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          
          {/* Reply Bar */}
          {replyingTo && (
            <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
              <View style={styles.replyBarContent}>
                <Text style={styles.replyBarTitle}>Javob: {replyingTo.sender === 'me' ? 'O\'zingizga' : 'Suhbatdoshga'}</Text>
                <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{replyingTo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
                <Text style={styles.replyBarCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Edit Bar */}
          {editingMessage && (
            <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
              <View style={styles.replyBarContent}>
                <Text style={styles.replyBarTitle}>Tahrirlash</Text>
                <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{editingMessage.text}</Text>
              </View>
              <TouchableOpacity onPress={() => {setEditingMessage(null); setInputText('');}} style={styles.replyBarClose}>
                <Text style={styles.replyBarCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Aqlli javob takliflari (SR) */}
          <SmartReplySuggestions 
            lastIncomingMessage={lastIncomingMessage?.text}
            onSelectReply={setInputText}
            isTyping={inputText.length > 0}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Xabar yozing..."
              placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
              value={inputText}
              onChangeText={setInputText}
              color={isDark ? '#FFF' : '#000'}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>{editingMessage ? 'Saqlash' : 'Jo\'natish'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Message Action Menu Modal */}
      <Modal transparent visible={!!selectedMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
          <View style={[styles.actionSheet, isDark && styles.actionSheetDark]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('react')}>
              <Text style={styles.actionBtnText}>Reaksiya qo'shish ❤️👍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('reply')}>
              <Text style={styles.actionBtnText}>Javob berish</Text>
            </TouchableOpacity>
            {selectedMessage?.sender === 'me' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('edit')}>
                <Text style={styles.actionBtnText}>Tahrirlash</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('delete')}>
              <Text style={[styles.actionBtnText, {color: '#FF3B30'}]}>O'chirish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Emoji Reaction Modal */}
      <Modal transparent visible={!!reactionMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReactionMessage(null)}>
          <View style={[styles.emojiSheet, isDark && styles.actionSheetDark]}>
            {['❤️', '👍', '😂', '🔥', '🎉'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerDark: { backgroundColor: '#1C1C1E', borderBottomColor: '#38383A' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 12, fontSize: 16 },
  searchInputDark: { backgroundColor: '#2C2C2E', color: '#FFF' },
  wallpaperBtn: { padding: 8, backgroundColor: '#E5E5EA', borderRadius: 8 },
  wallpaperBtnText: { color: '#0088CC', fontWeight: '600', fontSize: 12 },
  textDark: { color: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  chatArea: { flex: 1, backgroundColor: '#F7F7F8' },
  chatAreaDark: { backgroundColor: '#000000' },
  chatProfileHeader: { alignItems: 'center', marginBottom: 24 },
  chatName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleThem: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleThemDark: { backgroundColor: '#2C2C2E', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#0088CC', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  textThem: { color: '#000', fontSize: 16 },
  textMe: { color: '#FFF', fontSize: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, alignItems: 'center' },
  msgTime: { fontSize: 11, color: '#8E8E93' },
  editedText: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' },
  inputContainer: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: Platform.OS === 'ios' ? 0 : 16 },
  inputContainerDark: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
  inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  inputDark: { backgroundColor: '#2C2C2E' },
  sendBtn: { marginLeft: 12, padding: 10 },
  sendBtnText: { color: '#0088CC', fontWeight: '600', fontSize: 16 },
  replyBar: { flexDirection: 'row', padding: 12, backgroundColor: '#F7F7F8', borderTopWidth: 1, borderTopColor: '#E5E5EA', borderLeftWidth: 3, borderLeftColor: '#0088CC' },
  replyBarDark: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
  replyBarContent: { flex: 1 },
  replyBarTitle: { color: '#0088CC', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  replyBarText: { color: '#333', fontSize: 14 },
  replyBarClose: { padding: 4, justifyContent: 'center' },
  replyBarCloseText: { color: '#888', fontSize: 18 },
  replyBoxInBubble: { paddingLeft: 8, borderLeftWidth: 2, marginBottom: 6, paddingVertical: 2 },
  replyBoxThem: { borderLeftColor: '#0088CC', backgroundColor: 'rgba(0,136,204,0.1)', borderRadius: 4 },
  replyBoxThemDark: { borderLeftColor: '#0088CC', backgroundColor: 'rgba(0,136,204,0.2)', borderRadius: 4 },
  replyBoxMe: { borderLeftColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  replySenderThem: { color: '#0088CC', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  replySenderMe: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  actionSheet: { width: 250, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  actionSheetDark: { backgroundColor: '#2C2C2E' },
  actionBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', alignItems: 'center' },
  actionBtnText: { fontSize: 16, color: '#0088CC' },
  
  // Emoji styles
  emojiSheet: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 30 },
  emojiBtn: { marginHorizontal: 8 },
  emojiText: { fontSize: 32 },
  reactionsContainer: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  reactionBadge: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 4 },
  reactionText: { fontSize: 12 }
});
