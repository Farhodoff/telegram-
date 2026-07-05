import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/colors';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserStore } from '../store/useUserStore';

export default function VerifyCodeScreen({ route, navigation }) {
  const { phone } = route.params;
  const { settings } = useSettingsStore();
  const { login } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (code.length < 5) {
      setError('Kodni to\'liq kiriting (5 xona)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.isNewUser) {
          // Yangi foydalanuvchi bo'lsa, profil to'ldirish ekraniga o'tamiz
          navigation.navigate('ProfileSetup', { phone, token: data.token });
        } else {
          // Eski foydalanuvchi, to'g'ridan-to'g'ri tizimga kiritamiz
          login(data.token, { phone, name: 'Siz' });
        }
      } else {
        setError(data.error || 'Kod xato');
      }
    } catch (err) {
      setError('Server bilan ulanishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.content}>
          <Text style={[styles.title, isDark && styles.textDark]}>Kodni kiriting</Text>
          <Text style={styles.subtitle}>
            Biz <Text style={{fontWeight: 'bold', color: isDark ? '#FFF' : '#000'}}>{phone}</Text> raqamiga SMS orqali tasdiqlash kodini yubordik.
          </Text>

          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Kodni kiriting (masalan, 11111)"
            placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
            keyboardType="number-pad"
            maxLength={5}
            value={code}
            onChangeText={(text) => { setCode(text.replace(/[^0-9]/g, '')); setError(''); }}
            autoFocus
            textAlign="center"
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.nextBtn, (code.length < 5 || loading) && styles.nextBtnDisabled]} 
            onPress={handleVerify}
            disabled={code.length < 5 || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextBtnText}>Tasdiqlash</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={{marginTop: 20}} onPress={() => navigation.goBack()}>
            <Text style={{color: COLORS.primary, textAlign: 'center', fontSize: 16}}>Raqamni o'zgartirish</Text>
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
  input: { 
    backgroundColor: '#FFF', borderRadius: 12, 
    paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#E5E5EA',
    fontSize: 24, letterSpacing: 8, fontWeight: 'bold'
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
  errorText: { color: '#FF3B30', marginTop: 12, textAlign: 'center', fontSize: 14 }
});
