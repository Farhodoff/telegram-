import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import CryptoJS from 'crypto-js';
import { ReminderCard } from './ReminderCard';
import { detectReminderIntent } from '../../utils/reminderHelper';

export function MessageBubble({ msg, isDark, logic }) {
  const { 
    chatId, chat, swipeableRefs, setSelectedMessage, setReplyingTo, 
    setViewOnceImage, playSound, stopSound, playingAudioId, votePoll 
  } = logic;
  
  const secretKey = chat?.secretKey || 'fallback_key';
  
  let displayText = msg.text;
  let displayReplyText = msg.replyToText;
  
  try {
    if (msg.isEncrypted) {
      if (msg.text) displayText = CryptoJS.AES.decrypt(msg.text, secretKey).toString(CryptoJS.enc.Utf8);
      if (msg.replyToText) displayReplyText = CryptoJS.AES.decrypt(msg.replyToText, secretKey).toString(CryptoJS.enc.Utf8);
    }
  } catch (e) {
    displayText = "🔒 Encrypted Message (Error)";
  }
  
  const isThem = msg.sender === 'them';
  const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

  return (
    <View style={{ marginBottom: 16 }}>
      <Swipeable
        ref={ref => { if (ref) swipeableRefs.current[msg.id] = ref; }}
        renderRightActions={() => (
          <View style={{ justifyContent: 'center', alignItems: 'flex-start', width: 60, paddingLeft: 10 }}>
            <View style={{backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{ fontSize: 18 }}>↩️</Text>
            </View>
          </View>
        )}
        onSwipeableOpen={() => {
          setReplyingTo({ id: msg.id, text: displayText || 'Media', sender: msg.sender });
          swipeableRefs.current[msg.id]?.close();
        }}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onLongPress={() => setSelectedMessage({...msg, text: displayText})}
          delayLongPress={300}
          style={[styles.bubble, isThem ? (isDark ? styles.bubbleThemDark : styles.bubbleThem) : styles.bubbleMe]}
        >
          {displayReplyText && (
            <View style={[styles.replyBoxInBubble, isThem ? (isDark ? styles.replyBoxThemDark : styles.replyBoxThem) : styles.replyBoxMe]}>
              <Text style={[styles.replySenderInBubble, isThem ? styles.replySenderThem : styles.replySenderMe]}>
                {msg.replyToSender === 'me' ? 'Siz' : 'Suhbatdosh'}
              </Text>
              <Text numberOfLines={1} style={[styles.replyTextInBubble, isThem ? (isDark ? styles.textDark : {color: '#000'}) : styles.textMe]}>
                {displayReplyText}
              </Text>
            </View>
          )}
          <View style={{flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap'}}>
            <Text style={isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe}>{displayText}</Text>
            {msg.isEncrypted && <Text style={{fontSize: 10, marginLeft: 4, marginBottom: 2}}>🔒</Text>}
          </View>
          
          {msg.isForwarded && (
            <Text style={[styles.forwardedText, isThem ? null : {color: '#E0E0E0'}]}>
              Forwarded from {msg.forwardedFrom}
            </Text>
          )}

          {msg.imageUrl && !msg.isViewOnce && (
            <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
          )}

          {msg.imageUrl && msg.isViewOnce && (
            <TouchableOpacity 
              style={[styles.viewOnceBtn, isThem && !isDark && {borderColor: '#0088CC'}]}
              onPress={() => {
                if (!msg.isViewed) setViewOnceImage({ id: msg.id, uri: msg.imageUrl });
              }}
              disabled={msg.isViewed}
            >
              <Text style={{fontSize: 20, marginRight: 8}}>💣</Text>
              <Text style={{color: isThem ? (isDark ? '#FFF' : '#0088CC') : '#FFF', fontWeight: 'bold'}}>
                {msg.isViewed ? 'Ochilgan' : '1 marta ko\'rish'}
              </Text>
            </TouchableOpacity>
          )}

          {msg.location && (
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`)}
            >
              <Text style={{fontSize: 30, textAlign: 'center'}}>📍</Text>
              <Text style={{color: isThem ? (isDark ? '#888' : '#0088CC') : '#FFF', marginTop: 4, fontWeight: 'bold'}}>Xaritada ochish</Text>
            </TouchableOpacity>
          )}

          {msg.videoUrl && (
            <View style={styles.videoNoteContainer}>
              <Video
                source={{ uri: msg.videoUrl }}
                style={styles.videoNote}
                useNativeControls={false}
                resizeMode="cover"
                isLooping
                shouldPlay
                isMuted={false}
              />
            </View>
          )}

          {msg.audioUrl && (
            <View style={styles.audioContainer}>
              <TouchableOpacity 
                style={[styles.playBtn, isThem && !isDark && {backgroundColor: '#0088CC'}, isThem && isDark && {backgroundColor: '#555'}]} 
                onPress={() => playingAudioId === msg.id ? stopSound() : playSound(msg.audioUrl, msg.id)}
              >
                <Text style={{color: '#FFF', fontSize: 16}}>{playingAudioId === msg.id ? '⏸' : '▶️'}</Text>
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                <View style={styles.waveLine} />
                <View style={[styles.waveLine, {height: 12}]} />
                <View style={[styles.waveLine, {height: 8}]} />
                <View style={[styles.waveLine, {height: 16}]} />
                <View style={styles.waveLine} />
              </View>
              <Text style={{fontSize: 12, color: isThem ? (isDark ? '#888' : '#888') : '#FFF', marginLeft: 8}}>0:05</Text>
            </View>
          )}

          {msg.type === 'poll' && (
            <View style={styles.pollContainer}>
              <Text style={[styles.pollQuestion, isThem ? (isDark ? styles.textDark : {color: '#000'}) : {color: '#FFF'}]}>📊 {msg.question}</Text>
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
                    <View style={[styles.pollOptionProgress, { width: `${percent}%` }]} />
                    <View style={styles.pollOptionContent}>
                      <Text style={styles.pollOptionText}>{opt.text}</Text>
                      {totalVotes > 0 && <Text style={styles.pollPercentText}>{percent}%</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.pollTotalVotes}>{msg.options.reduce((s, o) => s + o.votes, 0)} ta ovoz</Text>
            </View>
          )}

          {msg.translatedText && (
            <View style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.3)'}}>
              <Text style={[isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe, {fontStyle: 'italic', fontSize: 14}]}>
                {msg.translatedText}
              </Text>
            </View>
          )}
          
          <View style={styles.timeRow}>
            {msg.isEdited && <Text style={[styles.editedText, isThem ? null : {color: '#E0E0E0'}]}>edited </Text>}
            <Text style={[styles.msgTime, isThem ? (isDark ? {color: '#888'} : null) : {color: '#E0E0E0'}]}>{msg.time}</Text>
          </View>

          {hasReactions && (
            <View style={styles.reactionsContainer}>
              {Object.entries(msg.reactions).map(([emoji, count]) => (
                <View key={emoji} style={styles.reactionBadge}>
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
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginTop: 4 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#0088CC', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E5EA' },
  bubbleThemDark: { alignSelf: 'flex-start', backgroundColor: '#2C2C2E', borderBottomLeftRadius: 4 },
  textMe: { color: '#FFF', fontSize: 16 },
  textThem: { color: '#000', fontSize: 16 },
  textDark: { color: '#FFF' },
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, alignItems: 'center' },
  msgTime: { fontSize: 11 },
  editedText: { fontSize: 11, fontStyle: 'italic', marginRight: 4 },
  replyBoxInBubble: { padding: 8, borderLeftWidth: 3, borderRadius: 4, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  replyBoxMe: { borderLeftColor: '#FFF' },
  replyBoxThem: { borderLeftColor: '#0088CC', backgroundColor: '#F0F8FF' },
  replyBoxThemDark: { borderLeftColor: '#0088CC', backgroundColor: '#3A3A3C' },
  replySenderMe: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  replySenderThem: { color: '#0088CC', fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  replyTextInBubble: { fontSize: 14 },
  forwardedText: { fontSize: 12, fontStyle: 'italic', color: '#888', marginBottom: 4 },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginVertical: 4 },
  viewOnceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  audioContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, padding: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20 },
  playBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  audioWaveform: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, height: 20 },
  waveLine: { width: 3, height: 16, backgroundColor: '#FFF', marginHorizontal: 2, borderRadius: 2 },
  pollContainer: { marginTop: 8, width: 220 },
  pollQuestion: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  pollOptionBtn: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden', marginBottom: 6, height: 36, justifyContent: 'center' },
  pollOptionProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,136,204,0.3)' },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, alignItems: 'center' },
  pollOptionText: { color: '#FFF', fontSize: 14 },
  pollPercentText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  pollTotalVotes: { color: '#FFF', fontSize: 12, textAlign: 'right', marginTop: 4, opacity: 0.8 },
  reactionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  reactionBadge: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 4 },
  reactionText: { fontSize: 12, color: '#FFF' },
  locationContainer: { padding: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  videoNoteContainer: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', backgroundColor: '#000', marginVertical: 4 },
  videoNote: { width: '100%', height: '100%' }
});
