import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Paperclip, Mic, Video as VideoIcon, ArrowUp, X, StopCircle } from 'lucide-react-native';
import { SmartReplySuggestions } from './SmartReplySuggestions';
import { COLORS } from '../../utils/colors';

export function ChatInputArea({ isDark, logic }) {
  const {
    inputText, setInputText, replyingTo, setReplyingTo, editingMessage, setEditingMessage,
    isRecording, recordMode, toggleRecordMode, startRecording, stopRecording, cameraRef,
    handleSend, setIsAttachmentOpen, setIsScheduleOpen, lastIncomingMessage
  } = logic;

  return (
    <>
      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        
        {replyingTo && (
          <Animated.View 
            entering={SlideInDown.duration(200)} 
            exiting={SlideOutDown.duration(200)} 
            style={styles.replyBarWrapper}
          >
            <View style={[styles.replyBar, { borderLeftColor: COLORS.primary }]}>
              <View style={styles.replyBarContent}>
                <Text style={[styles.replyBarTitle, { color: COLORS.primary }]}>
                  {replyingTo.sender === 'me' ? 'Sizga javob' : 'Javob'}
                </Text>
                <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{replyingTo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
                <X color={COLORS.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {editingMessage && (
          <Animated.View 
            entering={SlideInDown.duration(200)} 
            exiting={SlideOutDown.duration(200)} 
            style={styles.replyBarWrapper}
          >
            <View style={[styles.replyBar, { borderLeftColor: COLORS.primary }]}>
              <View style={styles.replyBarContent}>
                <Text style={[styles.replyBarTitle, { color: COLORS.primary }]}>Tahrirlash</Text>
                <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{editingMessage.text}</Text>
              </View>
              <TouchableOpacity onPress={() => {setEditingMessage(null); setInputText('');}} style={styles.replyBarClose}>
                <X color={COLORS.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <SmartReplySuggestions 
          lastIncomingMessage={lastIncomingMessage?.text}
          onSelectReply={setInputText}
          isTyping={inputText.length > 0}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setIsAttachmentOpen(true)}>
            <Paperclip color={COLORS.textSecondary} size={24} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Xabar yozing..."
            placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            color={isDark ? '#FFF' : '#000'}
          />
          {inputText.trim().length > 0 || editingMessage ? (
            <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: COLORS.primary }]} 
                onPress={handleSend}
                onLongPress={() => !editingMessage && setIsScheduleOpen(true)}
              >
                <ArrowUp color="#FFF" size={20} strokeWidth={3} />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
              <TouchableOpacity 
                style={styles.micBtn} 
                onPress={toggleRecordMode}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                {isRecording ? (
                  <StopCircle color="#FF3B30" size={26} />
                ) : recordMode === 'audio' ? (
                  <Mic color={COLORS.textSecondary} size={26} />
                ) : (
                  <VideoIcon color={COLORS.textSecondary} size={26} />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
      
      {isRecording && recordMode === 'video' && (
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraCircle}>
            <CameraView 
              ref={cameraRef} 
              style={{flex: 1}} 
              facing="front" 
              mode="video" 
              onCameraReady={() => logic.startVideoRecording()}
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: { 
    padding: 8, paddingBottom: 16, 
    backgroundColor: COLORS.headerLight, 
    borderTopWidth: 0.5, borderTopColor: COLORS.separatorLight 
  },
  inputContainerDark: { backgroundColor: COLORS.headerDark, borderTopColor: COLORS.separatorDark },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  
  attachBtn: { padding: 8, paddingBottom: 10 },
  
  input: { 
    flex: 1, 
    backgroundColor: COLORS.inputBgLight, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingTop: 12, paddingBottom: 12, 
    fontSize: 16, 
    marginHorizontal: 8, 
    minHeight: 40, maxHeight: 120 
  },
  inputDark: { backgroundColor: COLORS.inputBgDark, color: '#FFF' },
  
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4, marginRight: 4 },
  sendBtnIcon: { color: '#FFF', fontWeight: 'bold', fontSize: 20, marginTop: -2 },
  
  micBtn: { padding: 8, paddingBottom: 10 },
  
  replyBarWrapper: { paddingHorizontal: 8, marginBottom: 8 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, borderLeftWidth: 3 },
  replyBarContent: { flex: 1 },
  replyBarTitle: { fontWeight: 'bold', fontSize: 13 },
  replyBarText: { fontSize: 14, color: '#000', marginTop: 2 },
  replyBarClose: { padding: 8 },
  replyBarCloseText: { fontSize: 18, color: COLORS.textSecondary },
  
  textDark: { color: COLORS.textPrimaryDark },
  
  cameraOverlay: { position: 'absolute', bottom: 80, right: 20, width: 200, height: 200, borderRadius: 100, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  cameraCircle: { flex: 1, borderRadius: 100, overflow: 'hidden', backgroundColor: '#000' }
});
