import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { aiService } from '../../services/aiService';

/**
 * Smart Reply Suggestions (Aqlli javob takliflari)
 * Xabar kiritish maydoni (input bar) ustida chiqadigan gorizontal tugmalar.
 * 
 * @param {string} lastIncomingMessage - Oxirgi kelgan xabar matni
 * @param {function} onSelectReply - Tugma bosilganda ishlaydigan funksiya (matnni inputga o'tkazish)
 * @param {boolean} isTyping - Foydalanuvchi o'zi yoza boshlaganini bildiradi (animatsiya orqali yashirish uchun)
 */
export const SmartReplySuggestions = ({ lastIncomingMessage, onSelectReply, isTyping }) => {
  const [suggestions, setSuggestions] = useState([]);
  
  // Animatsiya qiymatlari (fade-in, slide-up)
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!lastIncomingMessage) {
        hideSuggestions();
        return;
      }
      
      const replies = await aiService.getSmartReplies(lastIncomingMessage);
      
      if (replies.length > 0) {
        setSuggestions(replies);
        showSuggestions();
      } else {
        hideSuggestions();
      }
    };

    fetchSuggestions();
  }, [lastIncomingMessage]);

  // Agar foydalanuvchi o'zi yoza boshlasa, yashiramiz
  useEffect(() => {
    if (isTyping) {
      hideSuggestions();
    }
  }, [isTyping]);

  const showSuggestions = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250, // 200-300ms ease-out
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideSuggestions = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => setSuggestions([])); // Animatsiya tugagach ro'yxatni tozalash
  };

  if (suggestions.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {suggestions.map((reply, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.pill} 
            onPress={() => onSelectReply(reply)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    // Input bar ustida joylashishi uchun
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  pill: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2A90F0',
    borderRadius: 20, // full pill shape
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8, // 8px gap between pills
  },
  pillText: {
    color: '#2A90F0',
    fontSize: 14,
    fontWeight: '500', // medium-weight text
  },
});
