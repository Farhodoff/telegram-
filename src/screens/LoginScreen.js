import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/colors';
import { useSettingsStore } from '../store/useSettingsStore';

export default function LoginScreen({ navigation }) {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (phone.length < 9) {
      setError('Iltimos to\'g\'ri raqam kiriting');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+998${phone}`;
      
      const response = await fetch('http://localhost:3000/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });
      
      const data = await response.json();
      
      if (data.success) {
        navigation.navigate('VerifyCode', { phone: formattedPhone });
      } else {
        setError(data.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setError('Server bilan ulanishda xatolik. Backend ishlayotganini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.content}>
          <Text style={[styles.title, isDark && styles.textDark]}>Telefon raqamingiz</Text>
          <Text style={styles.subtitle}>
            Iltimos, davlat kodini va telefon raqamingizni kiriting.
          </Text>

          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Text style={[styles.countryCode, isDark && styles.textDark]}>+998</Text>
            <View style={[styles.separator, isDark && styles.separatorDark]} />
            <TextInput
              style={[styles.input, isDark && styles.textDark]}
              placeholder="90 123 45 67"
              placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => { setPhone(text.replace(/[^0-9+]/g, '')); setError(''); }}
              autoFocus
            />
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.nextBtn, (!phone || loading) && styles.nextBtnDisabled]} 
            onPress={handleNext}
            disabled={!phone || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextBtnText}>Davom etish</Text>}
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
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FFF', borderRadius: 12, 
    paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#E5E5EA'
  },
  inputContainerDark: { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' },
  countryCode: { fontSize: 18, fontWeight: '500', width: 50 },
  separator: { width: 1, height: 24, backgroundColor: '#E5E5EA', marginHorizontal: 12 },
  separatorDark: { backgroundColor: '#2C2C2E' },
  input: { flex: 1, fontSize: 18, letterSpacing: 1 },
  nextBtn: { 
    backgroundColor: COLORS.primary, height: 50, borderRadius: 25, 
    justifyContent: 'center', alignItems: 'center', marginTop: 32,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  nextBtnDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  textDark: { color: '#FFF' },
  errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14 }
});
