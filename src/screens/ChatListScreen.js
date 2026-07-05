import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Modal, ScrollView, Alert, Image, Animated, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Search, Edit2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/useUserStore';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, getAvatarColor, getInitials } from '../utils/colors';
import { getRemoteTimeInfo } from '../utils/timezoneHelper';

export default function ChatListScreen({ navigation }) {
  const { user, token } = useUserStore();
  const { chats, fetchChats, restoreChats, createNewChat, stories, addStory } = useChatStore();
  const { settings, toggleTheme, toggleBiometric } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Ish', 'Saved Msgs'];
  
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [activeStory, setActiveStory] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchChats(token);
    setRefreshing(false);
  }, [token, fetchChats]);

  React.useEffect(() => {
    if (token) {
      fetchChats(token);
    }
  }, [token]);

  const chatArray = Object.values(chats).filter(chat => {
    const matchesTab = activeTab === 'All' || chat.folder === activeTab;
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Avatar komponenti
  const AvatarView = ({ name, size = 52 }) => {
    const colors = getAvatarColor(name);
    const initials = getInitials(name);
    return (
      <LinearGradient
        colors={colors}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
      </LinearGradient>
    );
  };

  const renderChatItem = ({ item }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const unreadCount = item.messages.filter(m => m.sender === 'them' && !m.isRead).length;
    
    let displayLastText = 'Xabar yo\'q';
    if (lastMessage) {
      if (lastMessage.isEncrypted && lastMessage.text) {
        try {
          const { mockDecrypt } = require('../store/encryption');
          displayLastText = mockDecrypt(lastMessage.text) || 'Xabar';
        } catch (e) {
          displayLastText = '🔒 Shifrlangan xabar';
        }
      } else if (lastMessage.imageUrl) {
        displayLastText = '🖼 Rasm';
      } else if (lastMessage.audioUrl) {
        displayLastText = '🎤 Ovozli xabar';
      } else if (lastMessage.videoUrl) {
        displayLastText = '🎥 Video xabar';
      } else if (lastMessage.location) {
        displayLastText = '📍 Joylashuv';
      } else if (lastMessage.type === 'poll') {
        displayLastText = '📊 ' + lastMessage.question;
      } else {
        displayLastText = lastMessage.text || 'Xabar';
      }
    }

    return (
      <TouchableOpacity 
        style={[styles.chatItem, isDark && styles.chatItemDark]}
        onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, chatName: item.name })}
        activeOpacity={0.6}
      >
        <View style={styles.avatarWrapper}>
          <AvatarView name={item.name} size={52} />
          {/* Online indicator */}
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={[styles.chatName, isDark && styles.textDark]} numberOfLines={1}>{item.name}</Text>
            {lastMessage && (
              <Text style={[styles.time, isDark && styles.timeDark]}>{lastMessage.time}</Text>
            )}
          </View>
          <View style={styles.chatBottomRow}>
            <View style={{flex: 1, marginRight: 8}}>
              <Text numberOfLines={1} style={[styles.lastMessage, isDark && styles.lastMessageDark]}>
                {lastMessage?.sender === 'me' && <Text style={{color: COLORS.primary}}>Siz: </Text>}
                {displayLastText}
              </Text>
              
              {/* Uxlash rejimi namoyishi (agar contact sleeping bo'lsa) */}
              {(() => {
                const timeInfo = getRemoteTimeInfo(item.timezone);
                if (timeInfo && timeInfo.isSleeping) {
                  return (
                    <View style={styles.sleepStatusRow}>
                      <Moon color={isDark ? '#888' : '#666'} size={12} />
                      <Text style={[styles.sleepStatusText, isDark && {color: '#888'}]}>
                        u yerda {timeInfo.timeString}, uxlayapti
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const loadContacts = async () => {
    setIsContactsOpen(true);
    try {
      const Contacts = require('expo-contacts');
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
    } catch (e) {
      Alert.alert('Xatolik', 'Kontaktlar moduli mavjud emas. Iltimos, development build yarating.');
    }
  };

  const startNewChat = (contact) => {
    setIsContactsOpen(false);
    const contactId = contact.id;
    const contactName = contact.name || 'Noma\'lum';
    createNewChat(contactId, contactName);
    navigation.navigate('ChatRoom', { chatId: contactId, chatName: contactName });
  };

  const handleAddStory = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      addStory(result.assets[0].uri);
    }
  };

  const renderStoryItem = ({ item, index }) => {
    if (index === 0) {
      return (
        <View style={{alignItems: 'center', marginRight: 14}}>
          <TouchableOpacity style={styles.storyAddBtn} onPress={handleAddStory}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.storyAddGradient}
            >
              <Text style={{fontSize: 22, color: '#FFF', fontWeight: '300'}}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.storyName, isDark && {color: COLORS.textSecondaryDark}]}>Mening</Text>
        </View>
      );
    }
    return (
      <View style={{alignItems: 'center', marginRight: 14}}>
        <TouchableOpacity onPress={() => setActiveStory(item)}>
          <LinearGradient
            colors={[COLORS.primary, '#229ED9']}
            style={styles.storyRing}
          >
            <View style={[styles.storyImageWrapper, isDark && {borderColor: COLORS.bgDark}]}>
              <Image source={{uri: item.uri}} style={styles.storyImage} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.storyName, isDark && {color: COLORS.textSecondaryDark}]}>Stori</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Telegram</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <View style={[styles.searchInputWrapper, isDark && styles.searchInputWrapperDark]}>
          <Search color={isDark ? '#888' : '#C7C7CC'} size={20} style={{marginRight: 8}} />
          <TextInput 
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder="Qidiruv..."
            placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
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

      {/* Stories */}
      <View style={[styles.storiesContainer, isDark && {borderBottomColor: COLORS.separatorDark}]}>
        <FlatList
          data={[{ id: 'add' }, ...stories]}
          keyExtractor={item => item.id}
          renderItem={renderStoryItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={chatArray}
        keyExtractor={item => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, isDark && styles.separatorDark]} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={loadContacts} activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.fabGradient}
        >
          <Edit2 color="#FFF" size={24} />
        </LinearGradient>
      </TouchableOpacity>



      {/* Contacts Modal */}
      <Modal visible={isContactsOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark, {height: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>Yangi Chat</Text>
              <TouchableOpacity onPress={() => setIsContactsOpen(false)}>
                <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={contactsList}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity style={[styles.contactItem, isDark && styles.contactItemDark]} onPress={() => startNewChat(item)}>
                  <AvatarView name={item.name || '?'} size={44} />
                  <View style={{marginLeft: 12}}>
                    <Text style={[styles.chatName, isDark && styles.textDark]}>{item.name || 'Ismsiz'}</Text>
                    <Text style={styles.contactPhone}>{item.phoneNumbers && item.phoneNumbers.length > 0 ? item.phoneNumbers[0].number : 'Raqam yo\'q'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Story View Modal */}
      <Modal visible={!!activeStory} transparent animationType="fade">
        <View style={styles.fullScreenStory}>
          {activeStory && (
            <Image source={{uri: activeStory.uri}} style={{width: '100%', height: '100%'}} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.closeStoryBtn} onPress={() => setActiveStory(null)}>
            <Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>Yopish</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  containerDark: { backgroundColor: COLORS.bgDark },
  
  // Header
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.headerLight,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight,
  },
  headerDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  headerBtn: { padding: 6, marginLeft: 12 },
  textDark: { color: COLORS.textPrimaryDark },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.headerLight },
  searchContainerDark: { backgroundColor: COLORS.headerDark },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInputWrapperDark: { backgroundColor: '#1C1C1E' },
  searchInput: { flex: 1, fontSize: 16 },

  // Tabs
  tabContainer: { 
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: COLORS.headerLight, 
    borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight,
  },
  tabContainerDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  tab: { paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, borderRadius: 16, backgroundColor: '#F0F2F5' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextDark: { color: COLORS.textSecondaryDark },
  tabTextActive: { color: '#FFF' },

  // Stories
  storiesContainer: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  storyAddBtn: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  storyAddGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyRing: { width: 60, height: 60, borderRadius: 30, padding: 2, justifyContent: 'center', alignItems: 'center' },
  storyImageWrapper: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.bgLight },
  storyImage: { width: '100%', height: '100%' },
  storyName: { fontSize: 11, textAlign: 'center', marginTop: 4, color: COLORS.textSecondary },

  // Chat Item
  chatItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.bgLight },
  chatItemDark: { backgroundColor: COLORS.bgDark },
  avatarWrapper: { position: 'relative', marginRight: 12 },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  onlineIndicator: { 
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.online, borderWidth: 2.5, borderColor: COLORS.bgLight 
  },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { color: COLORS.textSecondary, fontSize: 14 },
  lastMessageDark: { color: COLORS.textSecondaryDark },
  sleepStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  sleepStatusText: { fontSize: 12, color: '#666', marginLeft: 4 },
  time: { fontSize: 12, color: COLORS.textSecondary },
  timeDark: { color: COLORS.textSecondaryDark },
  unreadBadge: { 
    backgroundColor: '#2A90F0', minWidth: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Separator
  separator: { height: 0.5, backgroundColor: COLORS.separatorLight, marginLeft: 80 },
  separatorDark: { backgroundColor: COLORS.separatorDark },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  modalContentDark: { backgroundColor: COLORS.headerDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },

  // Settings
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  settingItemDark: { borderBottomColor: COLORS.separatorDark },
  settingText: { fontSize: 16, color: COLORS.textPrimary },

  // Contacts
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  contactItemDark: { borderBottomColor: COLORS.separatorDark },
  contactPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  // Story View
  fullScreenStory: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeStoryBtn: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
});
