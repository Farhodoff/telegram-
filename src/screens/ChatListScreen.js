import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, Modal, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';
import { useUserStore } from '../store/useUserStore';

export default function ChatListScreen({ navigation }) {
  const { chats, settings, toggleTheme, restoreChats, createNewChat } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  // Tablar uchun holat
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Ish', 'Saved Msgs'
  const tabs = ['All', 'Ish', 'Saved Msgs'];
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [contactsList, setContactsList] = useState([]);

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

  const exportData = async () => {
    try {
      const dataStr = JSON.stringify(chats);
      const fileUri = FileSystem.documentDirectory + 'telegram-backup.json';
      await FileSystem.writeAsStringAsync(fileUri, dataStr, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Xatolik', 'Faylni ulashish imkoni yo\'q');
      }
    } catch (error) {
      Alert.alert('Xatolik', 'Zaxira nusxasini yaratishda xatolik yuz berdi');
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const parsedData = JSON.parse(fileContent);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
          restoreChats(parsedData);
          Alert.alert('Muvaffaqiyat', 'Chatlar zaxiradan tiklandi!');
        } else {
          Alert.alert('Xatolik', 'Fayl formati noto\'g\'ri');
        }
      }
    } catch (error) {
      Alert.alert('Xatolik', 'Faylni o\'qishda xatolik yuz berdi');
    }
  };

  const loadContacts = async () => {
    setIsContactsOpen(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      if (data.length > 0) {
        setContactsList(data);
      }
    } else {
      Alert.alert('Ruxsat yo\'q', 'Kontaktlarni o\'qish uchun ruxsat bering');
    }
  };

  const startNewChat = (contact) => {
    setIsContactsOpen(false);
    const contactId = contact.id;
    const contactName = contact.name || 'Noma\'lum';
    createNewChat(contactId, contactName);
    navigation.navigate('ChatRoom', { chatId: contactId, chatName: contactName });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Custom Header for ChatList */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Chatlar</Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={[styles.themeToggle, {marginRight: 16}]}>
            <Text style={{fontSize: 20}}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={{fontSize: 20}}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
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

      <TouchableOpacity style={styles.fab} onPress={loadContacts}>
        <Text style={{fontSize: 24, color: '#FFF'}}>➕</Text>
      </TouchableOpacity>

      {/* Settings / Backup Modal */}
      <Modal visible={isSettingsOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>Sozlamalar</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={exportData}>
              <Text style={styles.actionBtnText}>💾 Chatlarni zaxiralash (Backup)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={importData}>
              <Text style={styles.actionBtnText}>🔄 Zaxirani tiklash (Restore)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contacts Modal */}
      <Modal visible={isContactsOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark, {height: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>Yangi Chat (Kontaktlar)</Text>
              <TouchableOpacity onPress={() => setIsContactsOpen(false)}>
                <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={contactsList}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.contactItem} onPress={() => startNewChat(item)}>
                  <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{item.name ? item.name.substring(0,2) : '?'}</Text></View>
                  <View>
                    <Text style={[styles.chatName, isDark && styles.textDark]}>{item.name || 'Ismsiz'}</Text>
                    <Text style={styles.lastMessage}>{item.phoneNumbers && item.phoneNumbers.length > 0 ? item.phoneNumbers[0].number : 'Raqam yo\'q'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 40 },
  modalContentDark: { backgroundColor: '#1C1C1E' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  actionBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  actionBtnText: { fontSize: 16, color: '#0088CC', fontWeight: '500' },
  contactItem: { flexDirection: 'row', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }
});
