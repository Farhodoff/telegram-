import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimezoneSelector } from '../settings/TimezoneSelector';
import { COLORS, getAvatarColor, getInitials } from '../../utils/colors';

export function ChatHeader({ isDark, isSearching, setIsSearching, searchQuery, setSearchQuery, chatName, navigation, isTyping }) {
  const isOnline = true; // Hardcode for now, can be hooked to store later

  const AvatarView = ({ name, size = 36 }) => {
    const colors = getAvatarColor(name);
    const initials = getInitials(name);
    return (
      <LinearGradient
        colors={colors}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
      </LinearGradient>
    );
  };

  return (
    <View style={[styles.header, isDark && styles.headerDark]}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: isDark ? '#FFF' : COLORS.primary }]}>‹</Text>
          <Text style={[styles.backText, { color: isDark ? '#FFF' : COLORS.primary }]}>Back</Text>
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
          <View style={styles.titleContainer}>
            <AvatarView name={chatName} size={36} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>{chatName}</Text>
              <View style={styles.statusRow}>
                {isTyping ? (
                  <Text style={[styles.statusText, {color: COLORS.primary}]}>yozmoqda...</Text>
                ) : (
                  isOnline && <Text style={[styles.statusText, {color: COLORS.primary}]}>online</Text>
                )}
                <Text style={{fontSize: 9, marginLeft: 6}}>🔒</Text>
                <Text style={{fontSize: 9, color: isDark ? '#4CAF50' : '#2E7D32', marginLeft: 2, fontWeight: 'bold'}}>E2E Encrypted</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => { setIsSearching(!isSearching); setSearchQuery(''); }} style={styles.searchBtn}>
          <Text style={{fontSize: 20, color: isDark ? '#FFF' : COLORS.primary}}>{isSearching ? '✕' : '🔍'}</Text>
        </TouchableOpacity>
      </View>
      {!isSearching && (
        <View style={styles.headerControls}>
          <TimezoneSelector />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, 
    backgroundColor: COLORS.headerLight, 
    borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight 
  },
  headerDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 4, marginLeft: -8, width: 70 },
  backIcon: { fontSize: 32, fontWeight: '300', marginTop: -4 },
  backText: { fontSize: 16, marginLeft: 4 },

  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  avatar: { justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  titleTextContainer: { flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusText: { fontSize: 13 },

  searchBtn: { padding: 8, width: 40, alignItems: 'flex-end' },

  headerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, marginHorizontal: 16, padding: 8, paddingHorizontal: 12, backgroundColor: COLORS.inputBgLight, borderRadius: 10 },
  searchInputDark: { backgroundColor: COLORS.inputBgDark, color: '#FFF' },
  textDark: { color: COLORS.textPrimaryDark },
});
