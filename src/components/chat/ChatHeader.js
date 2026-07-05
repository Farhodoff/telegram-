import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { TimezoneSelector } from '../settings/TimezoneSelector';

export function ChatHeader({ isDark, isSearching, setIsSearching, searchQuery, setSearchQuery, chatName, navigation }) {
  return (
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerDark: { backgroundColor: '#1C1C1E', borderBottomColor: '#38383A' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, marginHorizontal: 16, padding: 8, backgroundColor: '#F2F2F7', borderRadius: 8 },
  searchInputDark: { backgroundColor: '#2C2C2E', color: '#FFF' },
  textDark: { color: '#FFF' },
});
