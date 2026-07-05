import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useUserStore } from '../store/useUserStore';

export default function ChatListScreen({ navigation }) {
  const { chats, settings, toggleTheme } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  // Tablar uchun holat
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Ish', 'Saved Msgs'
  const tabs = ['All', 'Ish', 'Saved Msgs'];

  const chatArray = Object.values(chats).filter(chat => {
    if (activeTab === 'All') return true;
    return chat.folder === activeTab;
  });

  const renderChatItem = ({ item }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    return (
      <TouchableOpacity 
        style={[styles.chatItem, isDark && styles.chatItemDark]}
        onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, chatName: item.name })}
      >
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name.substring(0,2)}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, isDark && styles.textDark]}>{item.name}</Text>
          <Text numberOfLines={1} style={[styles.lastMessage, isDark && styles.lastMessageDark]}>
            {lastMessage ? lastMessage.text : 'Xabar yo\'q'}
          </Text>
        </View>
        {lastMessage && (
          <Text style={styles.time}>{lastMessage.time}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Custom Header for ChatList */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Chatlar</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={{fontSize: 20}}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs / Folders */}
      <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText, 
              isDark && styles.tabTextDark,
              activeTab === tab && styles.tabTextActive
            ]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={chatArray}
        keyExtractor={item => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    backgroundColor: '#FFF',
  },
  headerDark: {
    backgroundColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textDark: {
    color: '#FFF',
  },
  themeToggle: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  tabContainerDark: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#38383A',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  tabActive: {
    backgroundColor: '#0088CC',
  },
  tabText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  tabTextDark: {
    color: '#A1A1A6',
  },
  tabTextActive: {
    color: '#FFF',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chatItemDark: {
    backgroundColor: '#000',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    color: '#8E8E93',
    fontSize: 14,
  },
  lastMessageDark: {
    color: '#8E8E93',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  }
});
