import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ReminderCard } from './ReminderCard';
import { detectReminderIntent } from '../../utils/reminderHelper';
import { COLORS } from '../../utils/colors';

import { mockDecrypt } from '../../store/useUserStore';

export function MessageBubble({ msg, isDark, logic, searchQuery }) {
  const { 
    chatId, chat, swipeableRefs, setSelectedMessage, setReplyingTo, 
    setViewOnceImage, playSound, stopSound, playingAudioId, votePoll 
  } = logic;
  
  let displayText = msg.text;
  let displayReplyText = msg.replyToText;
  
  try {
    if (msg.isEncrypted) {
      if (msg.text) displayText = mockDecrypt(msg.text);
      if (msg.replyToText) displayReplyText = mockDecrypt(msg.replyToText);
    }
  } catch (e) {
    displayText = "🔒 Shifrlash xatoligi";
  }
  
  const isThem = msg.sender === 'them';
  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

  // Bubble style
  const bubbleBg = isThem 
    ? (isDark ? COLORS.bubbleThemDark : COLORS.bubbleThem) 
    : (isDark ? COLORS.bubbleMeDark : COLORS.bubbleMe);
  
  const textColor = isThem 
    ? (isDark ? COLORS.bubbleThemTextDark : COLORS.bubbleThemText) 
    : (isDark ? COLORS.bubbleMeTextDark : COLORS.bubbleMeText);

  const timeColor = isThem
    ? (isDark ? COLORS.bubbleThemTimeDark : COLORS.bubbleThemTime)
    : (isDark ? COLORS.bubbleMeTimeDark : COLORS.bubbleMeTime);

  const highlightText = (text, query) => {
    if (!query || !text) return <Text style={[styles.msgText, { color: textColor }]}>{text}</Text>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text style={[styles.msgText, { color: textColor }]}>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <Text key={i} style={{ backgroundColor: COLORS.primary + '80', color: isDark ? '#FFF' : '#000' }}>{part}</Text>
            : <Text key={i}>{part}</Text>
        )}
      </Text>
    );
  };

  return (
    <View style={{ marginBottom: 4 }}>
      <Swipeable
        ref={ref => { if (ref) swipeableRefs.current[msg.id] = ref; }}
        renderRightActions={() => (
          <View style={styles.swipeAction}>
            <Text style={{ fontSize: 18 }}>↩️</Text>
          </View>
        )}
        onSwipeableOpen={() => {
          setReplyingTo({ id: msg.id, text: displayText || 'Media', sender: msg.sender });
          swipeableRefs.current[msg.id]?.close();
        }}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => setSelectedMessage({...msg, text: displayText})}
          delayLongPress={300}
          style={[
            styles.bubble, 
            { backgroundColor: bubbleBg },
            isThem ? styles.bubbleThem : styles.bubbleMe,
            isThem && !isDark && styles.bubbleThemBorder,
          ]}
        >
          {/* Reply Box */}
          {displayReplyText && (
            <View style={[
              styles.replyBox, 
              { borderLeftColor: isThem ? COLORS.primary : (isDark ? '#6EC6F0' : '#4DAA57') }
            ]}>
              <Text style={[styles.replySender, { color: isThem ? COLORS.primary : (isDark ? '#6EC6F0' : '#4DAA57') }]}>
                {msg.replyToSender === 'me' ? 'Siz' : 'Suhbatdosh'}
              </Text>
              <Text numberOfLines={1} style={[styles.replyText, { color: textColor, opacity: 0.7 }]}>
                {displayReplyText}
              </Text>
            </View>
          )}

          {/* Message Text */}
          {displayText ? (
            <View style={styles.textRow}>
              {highlightText(displayText, searchQuery)}
            </View>
          ) : null}
          
          {/* Forwarded */}
          {msg.isForwarded && (
            <Text style={[styles.forwardedText, { color: timeColor }]}>
              ↗ Forwarded from {msg.forwardedFrom}
            </Text>
          )}

          {/* Image */}
          {msg.imageUrl && !msg.isViewOnce && (
            <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
          )}

          {/* View Once */}
          {msg.imageUrl && msg.isViewOnce && (
            <TouchableOpacity 
              style={styles.viewOnceBtn}
              onPress={() => {
                if (!msg.isViewed) setViewOnceImage({ id: msg.id, uri: msg.imageUrl });
              }}
              disabled={msg.isViewed}
            >
              <Text style={{fontSize: 20, marginRight: 8}}>💣</Text>
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>
                {msg.isViewed ? 'Ochilgan' : '1 marta ko\'rish'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Location */}
          {msg.location && (
            <TouchableOpacity 
              style={styles.locationBtn}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`)}
            >
              <Text style={{fontSize: 28}}>📍</Text>
              <Text style={{color: COLORS.primary, marginTop: 4, fontWeight: '600', fontSize: 13}}>Xaritada ochish</Text>
            </TouchableOpacity>
          )}

          {/* Video */}
          {msg.videoUrl && (
            <View style={styles.videoContainer}>
              <View style={styles.videoPlaceholder}>
                <Text style={{fontSize: 32}}>🎥</Text>
                <Text style={{color: '#FFF', fontSize: 11, marginTop: 4}}>Video xabar</Text>
              </View>
            </View>
          )}

          {/* Audio */}
          {msg.audioUrl && (
            <View style={styles.audioContainer}>
              <TouchableOpacity 
                style={styles.playBtn} 
                onPress={() => playingAudioId === msg.id ? stopSound() : playSound(msg.audioUrl, msg.id)}
              >
                <Text style={{color: '#FFF', fontSize: 14}}>{playingAudioId === msg.id ? '⏸' : '▶️'}</Text>
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                {[6, 12, 8, 16, 10, 14, 6, 10, 14, 8, 12, 6].map((h, i) => (
                  <View key={i} style={[styles.waveLine, { height: h, backgroundColor: isThem ? COLORS.primary : (isDark ? '#6EB4E0' : '#4DAA57') }]} />
                ))}
              </View>
              <Text style={[styles.audioTime, { color: timeColor }]}>0:05</Text>
            </View>
          )}

          {/* Poll */}
          {msg.type === 'poll' && (
            <View style={styles.pollContainer}>
              <Text style={[styles.pollQuestion, { color: textColor }]}>📊 {msg.question}</Text>
              {msg.options.map((opt, index) => {
                const totalVotes = msg.options.reduce((sum, o) => sum + o.votes, 0);
                const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.pollOptionBtn} 
                    onPress={() => votePoll(chatId, msg.id, index)}
                    disabled={msg.votedByMe !== null && msg.votedByMe !== undefined}
                  >
                    <View style={[styles.pollOptionProgress, { width: `${percent}%`, backgroundColor: COLORS.primary + '40' }]} />
                    <View style={styles.pollOptionContent}>
                      <Text style={[styles.pollOptionText, { color: textColor }]}>{opt.text}</Text>
                      {totalVotes > 0 && <Text style={[styles.pollPercent, { color: COLORS.primary }]}>{percent}%</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={[styles.pollTotal, { color: timeColor }]}>{msg.options.reduce((s, o) => s + o.votes, 0)} ta ovoz</Text>
            </View>
          )}

          {/* Translation */}
          {msg.translatedText && (
            <View style={styles.translationBox}>
              <Text style={[styles.translationText, { color: textColor }]}>
                {msg.translatedText}
              </Text>
            </View>
          )}
          
          {/* Time row with checkmarks */}
          <View style={styles.timeRow}>
            {msg.isEdited && <Text style={[styles.editedText, { color: timeColor }]}>edited </Text>}
            {msg.isEncrypted && <Text style={{fontSize: 9, marginRight: 2}}>🔒</Text>}
            <Text style={[styles.msgTime, { color: timeColor }]}>{msg.time}</Text>
            {!isThem && (
              <Text style={[styles.checkmarks, { color: timeColor }]}> ✓✓</Text>
            )}
          </View>

          {/* Reactions */}
          {hasReactions && (
            <View style={styles.reactionsContainer}>
              {Object.entries(msg.reactions).map(([emoji, count]) => (
                <View key={emoji} style={[styles.reactionBadge, isDark && styles.reactionBadgeDark]}>
                  <Text style={styles.reactionText}>{emoji} {count > 1 ? count : ''}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
      
      {isThem && detectReminderIntent(displayText) && (
        <ReminderCard 
          messageText={displayText} 
          onDismiss={() => {}} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', padding: 8, paddingHorizontal: 12, borderRadius: 18, marginTop: 2 },
  bubbleMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleThemBorder: { borderWidth: 0.5, borderColor: '#E5E5EA' },
  
  swipeAction: { justifyContent: 'center', alignItems: 'center', width: 50, paddingLeft: 8 },
  
  // Reply
  replyBox: { padding: 6, paddingHorizontal: 8, borderLeftWidth: 3, borderRadius: 4, marginBottom: 4, backgroundColor: 'rgba(0,0,0,0.04)' },
  replySender: { fontWeight: 'bold', fontSize: 12, marginBottom: 1 },
  replyText: { fontSize: 13 },

  // Text
  textRow: { flexDirection: 'row', flexWrap: 'wrap' },
  msgText: { fontSize: 16, lineHeight: 21 },
  
  // Forward
  forwardedText: { fontSize: 12, fontStyle: 'italic', marginBottom: 2 },

  // Image
  messageImage: { width: 220, height: 180, borderRadius: 14, marginVertical: 4 },
  
  // View Once
  viewOnceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 14, marginVertical: 4 },

  // Location
  locationBtn: { padding: 16, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 14, alignItems: 'center', marginVertical: 4 },

  // Video
  videoContainer: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', marginVertical: 4 },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },

  // Audio
  audioContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, padding: 4 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  audioWaveform: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, height: 20 },
  waveLine: { width: 2.5, marginHorizontal: 1, borderRadius: 2 },
  audioTime: { fontSize: 12, marginLeft: 8 },

  // Poll
  pollContainer: { marginTop: 4, width: 220 },
  pollQuestion: { fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  pollOptionBtn: { borderRadius: 8, overflow: 'hidden', marginBottom: 4, height: 34, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
  pollOptionProgress: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, alignItems: 'center' },
  pollOptionText: { fontSize: 14 },
  pollPercent: { fontSize: 12, fontWeight: 'bold' },
  pollTotal: { fontSize: 12, textAlign: 'right', marginTop: 2 },

  // Translation
  translationBox: { marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(150,150,150,0.2)' },
  translationText: { fontStyle: 'italic', fontSize: 14 },

  // Time Row
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2, alignItems: 'center' },
  msgTime: { fontSize: 11 },
  editedText: { fontSize: 11, fontStyle: 'italic', marginRight: 2 },
  checkmarks: { fontSize: 11, fontWeight: 'bold' },

  // Reactions
  reactionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  reactionBadge: { backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 2 },
  reactionBadgeDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  reactionText: { fontSize: 13 },
});
