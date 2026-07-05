import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';
import { CalendarPlus, X } from 'lucide-react-native';

/**
 * Chat xabari ostida chiqadigan "Eslatma qo'shish" kartasi
 * @param {boolean} isDarkMode - Dark mode faolligi
 * @param {string} messageText - Qaysi xabarga asosan eslatma qo'shilayotgani
 * @param {function} onDismiss - (X) tugmasi bosilganda kartani yopish funksiyasi
 */
export const ReminderCard = ({ isDarkMode = false, messageText = '', onDismiss }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const handleAddReminderClick = async () => {
    // expo-calendar orqali ruxsat so'rash
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      setShowPicker(true);
    } else {
      Alert.alert('Ruxsat yo\'q', 'Kalendardan foydalanish uchun ruxsat kerak.');
    }
  };

  const onDateChange = async (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); // iOS da modal ochiq qoladi, Androidda yopiladi
    setDate(currentDate);

    if (event.type === 'set' && selectedDate) {
      setShowPicker(false);
      await createCalendarEvent(currentDate);
    }
  };

  const createCalendarEvent = async (selectedDate) => {
    try {
      const defaultCalendarSource =
        Platform.OS === 'ios'
          ? await getDefaultCalendarSource()
          : { isLocalAccount: true, name: 'Expo Calendar' };

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(c => c.source.name === defaultCalendarSource.name) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert("Xato", "Kalendar topilmadi");
        return;
      }

      // Hodisa oxiri (1 soatdan keyin)
      const endDate = new Date(selectedDate.getTime() + 60 * 60 * 1000);

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: 'Telegram Eslatma',
        notes: `Xabar: "${messageText}"`,
        startDate: selectedDate,
        endDate: endDate,
        timeZone: 'GMT', // Yoki joriy timezone
      });

      Alert.alert('Muvaffaqiyatli', 'Eslatma kalendaringizga saqlandi!', [
        { text: 'OK', onPress: onDismiss }
      ]);
    } catch (error) {
      console.error('Kalendarga qo\'shishda xatolik:', error);
      Alert.alert('Xato', 'Eslatma qo\'shishda xatolik yuz berdi.');
    }
  };

  async function getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendars = calendars.filter((each) => each.source.name === 'Default');
    return defaultCalendars.length > 0 ? defaultCalendars[0].source : calendars[0].source;
  }

  const containerBg = isDarkMode ? styles.bgDark : styles.bgLight;
  const textColor = isDarkMode ? styles.textDark : styles.textLight;

  return (
    <View style={[styles.card, containerBg]}>
      <TouchableOpacity style={styles.content} onPress={handleAddReminderClick}>
        <CalendarPlus color={isDarkMode ? '#FFD54F' : '#D97706'} size={18} style={styles.icon} />
        <Text style={[styles.text, textColor]}>Eslatma qo'shish?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <X color={isDarkMode ? 'rgba(255,213,79,0.7)' : 'rgba(217,119,6,0.7)'} size={18} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  bgLight: {
    backgroundColor: '#FEF3C7', // soft amber
  },
  bgDark: {
    backgroundColor: '#4A3000', // deep brown/amber
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  textLight: {
    color: '#D97706',
  },
  textDark: {
    color: '#FFD54F',
  },
  dismissBtn: {
    paddingLeft: 12,
    paddingRight: 4,
  },
});
