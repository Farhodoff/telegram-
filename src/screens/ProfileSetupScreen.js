import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import { COLORS } from '../utils/colors';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserStore } from '../store/useUserStore';

export default function ProfileSetupScreen({ route, navigation }) {
  const { phone, token } = route.params;
  const { settings } = useSettingsStore();
  const { login } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleFinish = async () => {
    if (!firstName.trim()) return;
    
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      await fetch('http://localhost:3000/api/users/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: fullName })
      });
    } catch (e) {
      console.log('Error updating profile in DB', e);
    }

    login(token, { phone, name: fullName });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.content}>
          <Text style={[styles.title, isDark && styles.textDark]}>Profilingiz</Text>
          <Text style={styles.subtitle}>
            Ismingizni va ixtiyoriy ravishda rasmingizni kiriting.
          </Text>

          <View style={styles.avatarContainer}>
            <TouchableOpacity style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
              <Camera color={isDark ? '#FFF' : COLORS.primary} size={40} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Ism (majburiy)"
            placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
            value={firstName}
            onChangeText={setFirstName}
            autoFocus
          />
          
          <TextInput
            style={[styles.input, isDark && styles.inputDark, {marginTop: 16}]}
            placeholder="Familiya (ixtiyoriy)"
            placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
            value={lastName}
            onChangeText={setLastName}
          />

          <TouchableOpacity 
            style={[styles.nextBtn, !firstName.trim() && styles.nextBtnDisabled]} 
            onPress={handleFinish}
            disabled={!firstName.trim()}
          >
            <Text style={styles.nextBtnText}>Boshlash</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  containerDark: { backgroundColor: COLORS.bgDark },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#000' },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatarPlaceholder: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D1D6'
  },
  avatarPlaceholderDark: { backgroundColor: '#2C2C2E', borderColor: '#3A3A3C' },
  
  input: { 
    backgroundColor: '#FFF', borderRadius: 12, 
    paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#E5E5EA',
    fontSize: 18
  },
  inputDark: { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', color: '#FFF' },
  nextBtn: { 
    backgroundColor: COLORS.primary, height: 50, borderRadius: 25, 
    justifyContent: 'center', alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  nextBtnDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  textDark: { color: '#FFF' },
});
