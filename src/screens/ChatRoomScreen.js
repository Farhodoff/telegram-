import React from 'react';
import { StyleSheet, View, SafeAreaView, FlatList, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';

import { useChatRoomLogic } from '../hooks/useChatRoomLogic';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInputArea } from '../components/chat/ChatInputArea';
import { ChatModals } from '../components/chat/ChatModals';

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, chatName } = route.params;
  const logic = useChatRoomLogic(chatId, chatName);
  const { chat, isDark, isSearching, setIsSearching, searchQuery, setSearchQuery } = logic;

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader 
        isDark={isDark} 
        isSearching={isSearching} 
        setIsSearching={setIsSearching} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        chatName={chatName} 
        navigation={navigation} 
      />

      <ImageBackground 
        source={chat.wallpaper ? {uri: chat.wallpaper} : null} 
        style={[styles.messagesContainer, !chat.wallpaper && (isDark && styles.messagesContainerDark)]}
        imageStyle={{opacity: 0.5}}
      >
        <FlatList
          data={chat.messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} isDark={isDark} logic={logic} />}
          contentContainerStyle={{ padding: 16 }}
        />
      </ImageBackground>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ChatInputArea isDark={isDark} logic={logic} />
      </KeyboardAvoidingView>

      <ChatModals isDark={isDark} logic={logic} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  messagesContainer: { flex: 1, backgroundColor: '#E5E5EA' },
  messagesContainerDark: { backgroundColor: '#000' }
});
