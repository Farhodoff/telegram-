import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUserStore } from './src/store/useUserStore';
import { getDeviceTimezone } from './src/utils/timezoneHelper';

import ChatListScreen from './src/screens/ChatListScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, updateTimezone, settings } = useUserStore();
  const [isUnlocked, setIsUnlocked] = useState(!settings.biometricEnabled);

  useEffect(() => {
    if (!user.timezone) {
      const tz = getDeviceTimezone();
      updateTimezone(tz);
    }
  }, []);

  useEffect(() => {
    if (settings.biometricEnabled) {
      authenticate();
    } else {
      setIsUnlocked(true);
    }
  }, [settings.biometricEnabled]);

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Telegramga kirish',
        fallbackLabel: 'Parolni kiriting'
      });
      if (result.success) {
        setIsUnlocked(true);
      }
    } else {
      setIsUnlocked(true); // Qurilma qo'llab-quvvatlamasa o'tkazib yuborish
    }
  };

  if (!isUnlocked) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.lockText}>Telegram qulflangan</Text>
        <TouchableOpacity style={styles.unlockBtn} onPress={authenticate}>
          <Text style={styles.unlockBtnText}>Qulfni ochish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  lockIcon: { fontSize: 80, marginBottom: 20 },
  lockText: { color: '#FFF', fontSize: 20, marginBottom: 40, fontWeight: 'bold' },
  unlockBtn: { backgroundColor: '#0088CC', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  unlockBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
