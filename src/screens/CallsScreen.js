import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { PhoneMissed, Phone, PhoneOutgoing, PhoneIncoming, Video, VideoOff } from 'lucide-react-native';
import { useCallStore } from '../store/useCallStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, getAvatarColor, getInitials } from '../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function CallsScreen() {
  const { calls } = useCallStore();
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const [filter, setFilter] = useState('all'); // 'all' yoki 'missed'

  const filteredCalls = filter === 'missed' ? calls.filter(c => c.type === 'missed') : calls;

  const AvatarView = ({ name, size = 46 }) => {
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

  const getCallIcon = (type) => {
    if (type === 'missed') return <PhoneMissed color="#FF3B30" size={16} />;
    if (type === 'outgoing') return <PhoneOutgoing color={isDark ? '#FFF' : '#333'} size={16} />;
    if (type === 'incoming') return <PhoneIncoming color={isDark ? '#FFF' : '#333'} size={16} />;
    return <Phone color={isDark ? '#FFF' : '#333'} size={16} />;
  };

  const renderItem = ({ item }) => {
    const isMissed = item.type === 'missed';
    return (
      <View style={[styles.callItem, isDark && styles.callItemDark]}>
        <AvatarView name={item.name} />
        <View style={styles.callDetails}>
          <Text style={[styles.callName, isDark && styles.textDark, isMissed && { color: '#FF3B30' }]}>
            {item.name}
          </Text>
          <View style={styles.callStatusRow}>
            {getCallIcon(item.type)}
            <Text style={[styles.callTime, isDark && styles.textSecondaryDark]}> {item.time}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          {item.isVideo ? <Video color={COLORS.primary} size={24} /> : <Phone color={COLORS.primary} size={24} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Qo'ng'iroqlar</Text>
      </View>
      
      <View style={styles.segmentContainer}>
        <View style={[styles.segmentControl, isDark && styles.segmentControlDark]}>
          <TouchableOpacity 
            style={[styles.segmentBtn, filter === 'all' && (isDark ? styles.segmentActiveDark : styles.segmentActive)]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.segmentText, filter === 'all' && styles.segmentTextActive, isDark && {color: filter === 'all' ? '#FFF' : '#888'}]}>Barchasi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, filter === 'missed' && (isDark ? styles.segmentActiveDark : styles.segmentActive)]}
            onPress={() => setFilter('missed')}
          >
            <Text style={[styles.segmentText, filter === 'missed' && styles.segmentTextActive, isDark && {color: filter === 'missed' ? '#FFF' : '#888'}]}>O'tkazib yuborilgan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCalls}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: '#888'}}>Qo'ng'iroqlar yo'q</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  containerDark: { backgroundColor: COLORS.bgDark },
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  headerDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  segmentContainer: { padding: 10, alignItems: 'center' },
  segmentControl: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, width: '90%', padding: 2 },
  segmentControlDark: { backgroundColor: '#1C1C1E' },
  segmentBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  segmentActiveDark: { backgroundColor: '#3A3A3C' },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#333' },
  segmentTextActive: { fontWeight: 'bold' },

  listContent: { paddingHorizontal: 16 },
  callItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  callItemDark: { borderBottomColor: COLORS.separatorDark },
  avatar: { justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  callDetails: { flex: 1, justifyContent: 'center' },
  callName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  callStatusRow: { flexDirection: 'row', alignItems: 'center' },
  callTime: { fontSize: 13, color: '#666' },
  actionBtn: { padding: 8 },
  
  textDark: { color: COLORS.textPrimaryDark },
  textSecondaryDark: { color: COLORS.textSecondaryDark },
});
