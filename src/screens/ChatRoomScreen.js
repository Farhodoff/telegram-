import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, FlatList, KeyboardAvoidingView, Platform, ImageBackground, LayoutAnimation, UIManager, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatRoomLogic } from '../hooks/useChatRoomLogic';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInputArea } from '../components/chat/ChatInputArea';
import { ChatModals } from '../components/chat/ChatModals';
import { COLORS } from '../utils/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, chatName } = route.params;
  const logic = useChatRoomLogic(chatId, chatName);
  const { chat, isDark, isSearching, setIsSearching, searchQuery, setSearchQuery } = logic;
  
  const flatListRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [chat.messages.length]);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollBottom(offsetY > 100);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Matnni izlash filtri
  const filteredMessages = chat.messages.filter(m => {
    if (!isSearching || !searchQuery) return true;
    return m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Eng yangisi pastda turishi uchun ro'yxatni teskarisiga aylantiramiz va inverted qilamiz
  const reversedMessages = [...filteredMessages].reverse();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ChatHeader 
        isDark={isDark} 
        isSearching={isSearching} 
        setIsSearching={setIsSearching} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        chatName={chatName} 
        navigation={navigation} 
        isTyping={logic.isTyping}
      />

      <ImageBackground 
        source={chat.wallpaper ? {uri: chat.wallpaper} : null} 
        style={[styles.messagesContainer, !chat.wallpaper && (isDark && styles.messagesContainerDark)]}
        imageStyle={{opacity: chat.wallpaper ? 0.5 : 1}}
      >
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} isDark={isDark} logic={logic} searchQuery={searchQuery} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 16 }}
          inverted={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        
        {showScrollBottom && (
          <TouchableOpacity style={styles.scrollBottomBtn} onPress={scrollToBottom}>
            <Text style={{fontSize: 24, color: COLORS.primary}}>↓</Text>
          </TouchableOpacity>
        )}
      </ImageBackground>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ChatInputArea isDark={isDark} logic={logic} />
      </KeyboardAvoidingView>

      <ChatModals isDark={isDark} logic={logic} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  containerDark: { backgroundColor: COLORS.bgDark },
  messagesContainer: { flex: 1, backgroundColor: COLORS.bgChatLight },
  messagesContainerDark: { backgroundColor: COLORS.bgChatDark },
  scrollBottomBtn: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
