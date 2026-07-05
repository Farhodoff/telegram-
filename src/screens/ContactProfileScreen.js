import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Platform, Image, Modal, Alert, Linking } from 'react-native';
import { Phone, Video, Search, BellOff, Bell, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import { COLORS, getAvatarColor, getInitials } from '../utils/colors';
import { getRemoteTimeInfo } from '../utils/timezoneHelper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ContactProfileScreen({ route, navigation }) {
  const { chatId, chatName } = route.params;
  const { settings, toggleSmartMuteMode, toggleImportantContact } = useSettingsStore();
  const { chats } = useChatStore();
  const isDark = settings.theme === 'dark';
  const chat = chats[chatId];
  
  const scrollY = new Animated.Value(0);
  
  // Mute state derived from importantContacts if it was globally muted, but let's make it a simple local toggle visually
  const isMuted = !settings.smartMute?.importantContacts?.includes(chatId);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const timeInfo = chat?.timezone ? getRemoteTimeInfo(chat.timezone) : null;
  const isSleeping = timeInfo?.isSleeping;
  const statusText = isSleeping ? `uxlayapti • u yerda ${timeInfo.timeString}` : 'online';

  const avatarColors = getAvatarColor(chatName);
  const [activeTab, setActiveTab] = useState('Media');
  const [selectedImage, setSelectedImage] = useState(null);

  // Xabarlardan media va linklarni ajratish (Optimizatsiya)
  const allMessages = chat?.messages || [];
  
  const mediaItems = useMemo(() => allMessages.filter(m => m.imageUrl || m.videoUrl), [allMessages]);
  const linkItems = useMemo(() => allMessages.filter(m => m.text && (m.text.includes('http://') || m.text.includes('https://'))), [allMessages]);
  const docItems = useMemo(() => allMessages.filter(m => m.documentUrl), [allMessages]); // Hozircha document yo'q bo'lishi mumkin

  const renderGallery = () => {
    if (activeTab === 'Media') {
      if (mediaItems.length === 0) {
        return <Text style={[styles.emptyText, isDark && styles.textDark]}>Media mavjud emas</Text>;
      }
      return (
        <View style={styles.mediaGrid}>
          {mediaItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.mediaBox}
              onPress={() => item.imageUrl && setSelectedImage(item.imageUrl)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
              ) : (
                <View style={[styles.videoOverlay, { width: '100%', height: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }]}>
                  <Video color="#FFF" size={24} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (activeTab === 'Links') {
      if (linkItems.length === 0) {
        return <Text style={[styles.emptyText, isDark && styles.textDark]}>Linklar mavjud emas</Text>;
      }
      return (
        <View style={styles.linkList}>
          {linkItems.map((item) => {
            // Sodda URL ajratkich
            const urlMatch = item.text.match(/(https?:\/\/[^\s]+)/g);
            const url = urlMatch ? urlMatch[0] : item.text;
            return (
              <TouchableOpacity key={item.id} style={styles.linkItem} onPress={() => Linking.openURL(url).catch(() => {})}>
                <View style={styles.linkIconBox}>
                  <Search color="#FFF" size={20} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={[styles.linkUrl, {color: COLORS.primary}]} numberOfLines={1}>{url}</Text>
                  <Text style={[styles.linkSubtitle, isDark && styles.textSecondaryDark]}>{item.time} da yuborilgan</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      );
    } else {
      return <Text style={[styles.emptyText, isDark && styles.textDark]}>Hujjatlar mavjud emas</Text>;
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Animated.View style={[styles.header, { height: headerHeight }, isDark && styles.headerDark]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          <LinearGradient colors={avatarColors} style={styles.avatarGradient}>
            <Text style={styles.largeInitials}>{initials}</Text>
          </LinearGradient>
          <View style={styles.headerInfoOverlay}>
            <Text style={styles.headerName}>{chatName}</Text>
            <Text style={styles.headerStatus}>{statusText}</Text>
          </View>
        </Animated.View>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#FFF" size={32} />
          </TouchableOpacity>
          <Animated.Text style={[styles.topBarTitle, { opacity: titleOpacity }]}>
            {chatName}
          </Animated.Text>
          <View style={{width: 32}} /> {/* Placeholder */}
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={[styles.actionsCard, isDark && styles.actionsCardDark]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Hozircha o'chirilgan", "Ovozli qo'ng'iroq funksiyasi tez orada qo'shiladi.")}>
            <Phone color={COLORS.primary} size={24} />
            <Text style={[styles.actionText, {color: COLORS.primary}]}>Qo'ng'iroq</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Hozircha o'chirilgan", "Video qo'ng'iroq funksiyasi tez orada qo'shiladi.")}>
            <Video color={COLORS.primary} size={24} />
            <Text style={[styles.actionText, {color: COLORS.primary}]}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Search color={COLORS.primary} size={24} />
            <Text style={[styles.actionText, {color: COLORS.primary}]}>Qidiruv</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleImportantContact(chatId)}>
            {isMuted ? <BellOff color="#FF3B30" size={24} /> : <Bell color={COLORS.primary} size={24} />}
            <Text style={[styles.actionText, {color: isMuted ? '#FF3B30' : COLORS.primary}]}>{isMuted ? 'Yoqish' : 'O\'chirish'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
          <Text style={[styles.infoTitle, {color: COLORS.primary}]}>Ma'lumot</Text>
          <Text style={[styles.infoContent, isDark && styles.textDark]}>+998 90 123 45 67</Text>
          <Text style={styles.infoSubtitle}>Telefon</Text>
          <View style={styles.separator} />
          <Text style={[styles.infoContent, isDark && styles.textDark]}>@username_here</Text>
          <Text style={styles.infoSubtitle}>Username</Text>
          <View style={styles.separator} />
          <Text style={[styles.infoContent, isDark && styles.textDark]}>Mening bio yozuvim shu yerda bo'ladi. Meni bezovta qilmang!</Text>
          <Text style={styles.infoSubtitle}>Bio</Text>
        </View>

        {/* TAB MENU */}
        <View style={[styles.tabsContainer, isDark && styles.tabsContainerDark]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {['Media', 'Links', 'Hujjatlar'].map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : (isDark && styles.inactiveTabTextDark)]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.mediaCard, isDark && styles.mediaCardDark]}>
          {renderGallery()}
        </View>
      </ScrollView>

      {/* Rasm ko'rish uchun Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
            <ChevronLeft color="#FFF" size={32} />
            <Text style={{color: '#FFF', fontSize: 18}}>Orqaga</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFF4' },
  containerDark: { backgroundColor: '#000' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 1, backgroundColor: COLORS.primary },
  headerDark: { backgroundColor: '#1C1C1E' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  largeInitials: { fontSize: 80, color: '#FFF', fontWeight: 'bold' },
  headerInfoOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  headerName: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  headerStatus: { fontSize: 14, color: '#FFF', opacity: 0.8, marginTop: 4 },
  
  topBar: { position: 'absolute', top: Platform.OS === 'android' ? 30 : 40, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  backBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },

  actionsCard: { flexDirection: 'row', backgroundColor: '#FFF', marginVertical: 16, paddingVertical: 12, borderRadius: 12, marginHorizontal: 12, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  actionsCardDark: { backgroundColor: '#1C1C1E' },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { marginTop: 8, fontSize: 13, fontWeight: '500' },

  infoCard: { backgroundColor: '#FFF', padding: 16, marginHorizontal: 12, borderRadius: 12, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  infoCardDark: { backgroundColor: '#1C1C1E' },
  infoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoContent: { fontSize: 16 },
  infoSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  separator: { height: 0.5, backgroundColor: '#E5E5EA', marginVertical: 12 },
  textDark: { color: '#FFF' },

  mediaCardDark: { backgroundColor: '#1C1C1E' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  mediaBox: { width: (width - 48) / 3, height: (width - 48) / 3, backgroundColor: '#F0F0F0', borderRadius: 8, marginBottom: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 16 },
  
  tabsContainer: { backgroundColor: '#FFF', marginHorizontal: 12, borderRadius: 12, marginBottom: 12, paddingVertical: 8, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  tabsContainerDark: { backgroundColor: '#1C1C1E' },
  tabsScroll: { paddingHorizontal: 16, alignItems: 'center' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, backgroundColor: '#F2F2F7' },
  activeTabBtn: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: '#333' },
  activeTabText: { color: '#FFF' },
  inactiveTabTextDark: { color: '#888' },

  linkList: { width: '100%' },
  linkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  linkIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#A2ACBE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  linkInfo: { flex: 1 },
  linkUrl: { fontSize: 15, marginBottom: 4 },
  linkSubtitle: { fontSize: 13, color: '#888' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, left: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  fullScreenImage: { width: '100%', height: '80%' },
  textSecondaryDark: { color: '#8E8E93' }
});
