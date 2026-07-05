// Oddiy tasodifiy raqamlar generatori (faqat UI demo uchun, chunki native modul ulangan emas)
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = function (array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUserStore } from './src/store/useUserStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useSocketStore } from './src/store/useSocketStore';
import { getDeviceTimezone } from './src/utils/timezoneHelper';
import { COLORS } from './src/utils/colors';

import ChatListScreen from './src/screens/ChatListScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ContactProfileScreen from './src/screens/ContactProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CallsScreen from './src/screens/CallsScreen';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? COLORS.headerDark : COLORS.headerLight,
          borderTopColor: isDark ? COLORS.separatorDark : COLORS.separatorLight,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary,
      }}
    >
      <Tab.Screen 
        name="ChatsTab" 
        component={ChatListScreen} 
        options={{ 
          title: 'Chatlar',
          tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>💬</Text>
        }} 
      />
      <Tab.Screen 
        name="CallsTab" 
        component={CallsScreen} 
        options={{ 
          title: 'Qo\'ng\'iroqlar',
          tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>📞</Text>
        }} 
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ 
          title: 'Sozlamalar',
          tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>⚙️</Text>
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, token, isAuthenticated, updateTimezone } = useUserStore();
  const { settings } = useSettingsStore();
  const { connect, disconnect } = useSocketStore();
  const [isUnlocked, setIsUnlocked] = useState(!settings?.biometricEnabled);

  useEffect(() => {
    if (!user.timezone) {
      const tz = getDeviceTimezone();
      updateTimezone(tz);
    }
  }, []);

  useEffect(() => {
    // Socket.io ulanish mantiqi
    if (isAuthenticated && token) {
      connect(token, user.phone);
    } else {
      disconnect();
    }
  }, [isAuthenticated, token, user.phone]);

  useEffect(() => {
    if (settings?.biometricEnabled) {
      authenticate();
    } else {
      setIsUnlocked(true);
    }
  }, [settings?.biometricEnabled]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              // --- Auth Stack ---
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
                <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
              </>
            ) : (
              // --- Main Stack ---
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
                <Stack.Screen name="ContactProfile" component={ContactProfileScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E1621' },
  lockIcon: { fontSize: 80, marginBottom: 20 },
  lockText: { color: '#FFF', fontSize: 20, marginBottom: 40, fontWeight: 'bold' },
  unlockBtn: { backgroundColor: '#2AABEE', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  unlockBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
