import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLocalTime, getStatusIcon } from '../../utils/dateHelper';

/**
 * Chat Header ostida ko'rsatiladigan Timezone Badge komponenti
 * @param {string} timezone - Suhbatdoshning vaqt zonasi (masalan, 'Asia/Tashkent')
 * @param {boolean} isDarkMode - Dark mode faol yoki yo'qligini bildiradi
 */
export const TimezoneBadge = ({ timezone, isDarkMode = false }) => {
  // Boshlang'ich vaqt va ikonka state
  const [localTime, setLocalTime] = useState('');
  const [icon, setIcon] = useState('');

  // Vaqtni yangilash funksiyasi
  const updateTime = () => {
    if (timezone) {
      const time = getLocalTime(timezone);
      setLocalTime(time);
      setIcon(getStatusIcon(time));
    }
  };

  useEffect(() => {
    // Komponent yuklanganda birinchi marta vaqtni o'rnatish
    updateTime();

    // Har daqiqada vaqtni yangilab turish (TZ-07: Real-time yangilanish)
    const intervalId = setInterval(updateTime, 60000);

    // Komponent unmount bo'lganda intervalni tozalash
    return () => clearInterval(intervalId);
  }, [timezone]);

  // Agar timezone berilmagan bo'lsa yoki noto'g'ri bo'lsa, hech narsa ko'rsatmaymiz
  if (!timezone || !localTime) return null;

  const containerStyle = isDarkMode ? styles.containerDark : styles.containerLight;
  const textStyle = isDarkMode ? styles.textDark : styles.textLight;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, textStyle]}>
        {localTime} {icon}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12, // Pill background
    alignSelf: 'flex-start',
    opacity: 0.8, // Soft opacity
  },
  containerLight: {
    backgroundColor: '#F2F2F7', // Light gray
  },
  containerDark: {
    backgroundColor: '#2C2C2E', // Dark gray
  },
  text: {
    fontSize: 12,
  },
  textLight: {
    color: '#8E8E93', // Subtle gray text in light mode
  },
  textDark: {
    color: '#EBEBF5', // Lighter text in dark mode for contrast
  },
});
