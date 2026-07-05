import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useUserStore } from '../store/useUserStore';
import { COLORS, getAvatarColor, getInitials } from '../utils/colors';

export default function SettingsScreen() {
  const { user, setUser, settings, toggleTheme, toggleBiometric, restoreChats, chats } = useUserStore();
  const isDark = settings.theme === 'dark';

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(user.bio || ''); // user.bio ni store'ga qo'shish kerak agar yo'q bo'lsa

  const handlePickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  const handleSaveName = () => {
    setUser({ ...user, name: editName });
    setIsEditingName(false);
  };

  const handleSaveBio = () => {
    setUser({ ...user, bio: editBio });
    setIsEditingBio(false);
  };

  const AvatarView = ({ name, size = 100 }) => {
    if (user.avatar) {
      return <Image source={{ uri: user.avatar }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
    }
    const colors = getAvatarColor(name || 'User');
    const initials = getInitials(name || 'User');
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Sozlamalar</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}}>
          {/* Profil Qismi */}
          <View style={[styles.profileSection, isDark && styles.sectionDark]}>
            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
              <AvatarView name={user.name} />
              <View style={styles.avatarEditBadge}>
                <Text style={{fontSize: 14, color: '#FFF'}}>📷</Text>
              </View>
            </TouchableOpacity>

            {/* Ism */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Ism</Text>
              {isEditingName ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    color={isDark ? '#FFF' : '#000'}
                  />
                  <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Saqlash</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.displayContainer}>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>{user.name || 'Ism kiritilmagan'}</Text>
                  <TouchableOpacity onPress={() => { setIsEditingName(true); setEditName(user.name || ''); }}>
                    <Text style={{color: COLORS.primary}}>Tahrirlash</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.separator, isDark && styles.separatorDark]} />

            {/* Bio */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>O'zim haqimda (Bio)</Text>
              {isEditingBio ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    value={editBio}
                    onChangeText={setEditBio}
                    autoFocus
                    color={isDark ? '#FFF' : '#000'}
                    placeholder="O'zingiz haqingizda yozing..."
                    placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
                  />
                  <TouchableOpacity onPress={handleSaveBio} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Saqlash</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.displayContainer}>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>{user.bio || 'Bio kiritilmagan'}</Text>
                  <TouchableOpacity onPress={() => { setIsEditingBio(true); setEditBio(user.bio || ''); }}>
                    <Text style={{color: COLORS.primary}}>Tahrirlash</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Sozlamalar Qismi */}
          <Text style={[styles.sectionTitle, isDark && styles.textSecondaryDark]}>UMUMIY SOZLAMALAR</Text>
          <View style={[styles.settingsSection, isDark && styles.sectionDark]}>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingText, isDark && styles.textDark]}>🌙 Tungi rejim (Dark Mode)</Text>
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E5EA', true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>
            <View style={[styles.separator, isDark && styles.separatorDark]} />

            <View style={styles.settingItem}>
              <Text style={[styles.settingText, isDark && styles.textDark]}>🔐 Biometrik Qulf</Text>
              <Switch 
                value={settings.biometricEnabled} 
                onValueChange={toggleBiometric}
                trackColor={{ false: '#E5E5EA', true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>

          </View>

          <Text style={[styles.sectionTitle, isDark && styles.textSecondaryDark]}>MA'LUMOTLAR</Text>
          <View style={[styles.settingsSection, isDark && styles.sectionDark]}>
            <TouchableOpacity style={styles.settingItem} onPress={exportData}>
              <Text style={[styles.settingText, isDark && styles.textDark]}>💾 Chatlarni zaxiralash (Export)</Text>
            </TouchableOpacity>
            <View style={[styles.separator, isDark && styles.separatorDark]} />
            <TouchableOpacity style={styles.settingItem} onPress={importData}>
              <Text style={[styles.settingText, isDark && styles.textDark]}>🔄 Zaxirani tiklash (Import)</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgChatLight },
  containerDark: { backgroundColor: COLORS.bgDark },
  header: { 
    padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, 
    backgroundColor: COLORS.headerLight, 
    borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight,
    alignItems: 'center'
  },
  headerDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  textDark: { color: COLORS.textPrimaryDark },
  textSecondaryDark: { color: COLORS.textSecondaryDark },
  
  profileSection: { backgroundColor: COLORS.bgLight, paddingVertical: 24, marginBottom: 20, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  sectionDark: { backgroundColor: COLORS.headerDark, borderBottomColor: COLORS.separatorDark },
  
  avatarContainer: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgLight },
  
  infoRow: { paddingHorizontal: 16, paddingVertical: 8 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  displayContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoValue: { fontSize: 16, color: COLORS.textPrimary },
  
  editContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingVertical: 4, fontSize: 16 },
  inputDark: { color: '#FFF' },
  saveBtn: { marginLeft: 12, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },

  separator: { height: 0.5, backgroundColor: COLORS.separatorLight, marginLeft: 16 },
  separatorDark: { backgroundColor: COLORS.separatorDark },

  sectionTitle: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 16, marginBottom: 8, marginTop: 16 },
  settingsSection: { backgroundColor: COLORS.bgLight, borderTopWidth: 0.5, borderTopColor: COLORS.separatorLight, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingText: { fontSize: 16, color: COLORS.textPrimary },
});
