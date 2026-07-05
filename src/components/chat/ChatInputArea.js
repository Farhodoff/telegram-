import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { SmartReplySuggestions } from './SmartReplySuggestions';

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
          <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarTitle}>Javob: {replyingTo.sender === 'me' ? 'O\'zingizga' : 'Suhbatdoshga'}</Text>
              <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{replyingTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyBarClose}>
              <Text style={styles.replyBarCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {editingMessage && (
          <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarTitle}>Tahrirlash</Text>
              <Text numberOfLines={1} style={[styles.replyBarText, isDark && styles.textDark]}>{editingMessage.text}</Text>
            </View>
            <TouchableOpacity onPress={() => {setEditingMessage(null); setInputText('');}} style={styles.replyBarClose}>
              <Text style={styles.replyBarCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <SmartReplySuggestions 
          lastIncomingMessage={lastIncomingMessage?.text}
          onSelectReply={setInputText}
          isTyping={inputText.length > 0}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setIsAttachmentOpen(true)}>
            <Text style={{fontSize: 22}}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Xabar yozing..."
            placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
            value={inputText}
            onChangeText={setInputText}
            color={isDark ? '#FFF' : '#000'}
          />
          {inputText.trim().length > 0 || editingMessage ? (
            <TouchableOpacity 
              style={styles.sendBtn} 
              onPress={handleSend}
              onLongPress={() => !editingMessage && setIsScheduleOpen(true)}
            >
              <Text style={styles.sendBtnText}>{editingMessage ? 'Saqlash' : 'Jo\'natish'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.micBtn} 
              onPress={toggleRecordMode}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Text style={{fontSize: 20, color: '#FFF'}}>
                {isRecording ? '🛑' : (recordMode === 'audio' ? '🎤' : '📷')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {isRecording && recordMode === 'video' && (
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraCircle}>
            <CameraView ref={cameraRef} style={{flex: 1}} facing="front" mode="video" />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: { padding: 8, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  inputContainerDark: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  attachBtn: { padding: 8 },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginHorizontal: 8, maxHeight: 100 },
  inputDark: { backgroundColor: '#2C2C2E', color: '#FFF' },
  sendBtn: { backgroundColor: '#0088CC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' },
  micBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0088CC', justifyContent: 'center', alignItems: 'center' },
  replyBar: { flexDirection: 'row', alignItems: 'center', padding: 8, borderLeftWidth: 3, borderLeftColor: '#0088CC', backgroundColor: '#F2F2F7', marginBottom: 8, borderRadius: 4 },
  replyBarDark: { backgroundColor: '#2C2C2E' },
  replyBarContent: { flex: 1 },
  replyBarTitle: { color: '#0088CC', fontWeight: 'bold', fontSize: 14 },
  replyBarText: { fontSize: 14, color: '#000', marginTop: 2 },
  replyBarClose: { padding: 8 },
  replyBarCloseText: { fontSize: 18, color: '#888' },
  textDark: { color: '#FFF' },
  cameraOverlay: { position: 'absolute', bottom: 80, right: 20, width: 200, height: 200, borderRadius: 100, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10 },
  cameraCircle: { flex: 1, borderRadius: 100, overflow: 'hidden', backgroundColor: '#000' }
});
