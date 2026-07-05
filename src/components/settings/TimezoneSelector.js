import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useUserStore } from '../../store/useUserStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { userService } from '../../services/userService';

const COMMON_TIMEZONES = [
  { id: 'Asia/Tashkent', label: 'Toshkent (UZT)' },
  { id: 'America/New_York', label: 'Nyu-York (EST)' },
  { id: 'Europe/London', label: 'London (GMT)' },
  { id: 'Europe/Moscow', label: 'Moskva (MSK)' },
  { id: 'Asia/Dubai', label: 'Dubay (GST)' },
];

export const TimezoneSelector = () => {
  const { user, updateTimezone } = useUserStore();
  const { settings } = useSettingsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = settings.theme === 'dark';

  const handleSelectTimezone = async (tzId) => {
    setIsLoading(true);
    // Zustand orqali darhol state'ni yangilaymiz (Optimistic update)
    updateTimezone(tzId);
    
    // Backendga yuboramiz
    if (user.id) {
      await userService.updateUserTimezone(user.id, tzId);
    }
    
    setIsLoading(false);
    setModalVisible(false);
  };

  const currentLabel = COMMON_TIMEZONES.find(t => t.id === user.timezone)?.label || user.timezone || 'Tanlanmagan';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vaqt zonasi</Text>
      
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>{currentLabel}</Text>
        <Text style={styles.selectorIcon}>›</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vaqt zonasini tanlang</Text>
            
            <FlatList
              data={COMMON_TIMEZONES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.item, user.timezone === item.id && styles.itemSelected]}
                  onPress={() => handleSelectTimezone(item.id)}
                  disabled={isLoading}
                >
                  <Text style={[styles.itemText, user.timezone === item.id && styles.itemTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12, // Umumiy style guide bo'yicha
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
  },
  selectorIcon: {
    fontSize: 20,
    color: '#c7c7cc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemSelected: {
    backgroundColor: '#e6f3fa', // Telegram blue light version
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
  itemTextSelected: {
    color: '#0088CC', // Telegram blue
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#0088CC',
    fontSize: 16,
    fontWeight: '500',
  },
});
