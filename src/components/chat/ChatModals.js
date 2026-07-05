import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, StyleSheet, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../utils/colors';

export function ChatModals({ isDark, logic }) {
  const {
    chats,
    selectedMessage, setSelectedMessage,
    reactionMessage, setReactionMessage,
    isForwarding, setIsForwarding,
    isAttachmentOpen, setIsAttachmentOpen,
    isCreatePollOpen, setIsCreatePollOpen,
    viewOnceImage, setViewOnceImage,
    isScheduleOpen, setIsScheduleOpen,
    pollQuestion, setPollQuestion,
    pollOptions, setPollOptions,
    handleAction, handleForwardTo, handleReaction,
    pickImage, sendLocation, pickWallpaper,
    markAsViewed, handleCreatePoll, handleSchedule, chatId
  } = logic;

  return (
    <>
      {/* Action Sheet Modal */}
      <Modal transparent visible={!!selectedMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
          <TouchableWithoutFeedback>
            <View style={[styles.actionSheet, isDark && styles.actionSheetDark]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('react')}>
                <Text style={styles.actionBtnText}>Reaksiya qo'shish ❤️👍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('reply')}>
                <Text style={styles.actionBtnText}>Javob berish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('forward')}>
                <Text style={styles.actionBtnText}>Yo'naltirish (Forward)</Text>
              </TouchableOpacity>
              {selectedMessage?.text && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('translate')}>
                  <Text style={styles.actionBtnText}>Tarjima qilish</Text>
                </TouchableOpacity>
              )}
              {selectedMessage?.sender === 'me' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('edit')}>
                  <Text style={styles.actionBtnText}>Tahrirlash</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={() => handleAction('delete')}>
                <Text style={[styles.actionBtnText, {color: COLORS.danger}]}>O'chirish</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Emoji Reaction Modal */}
      <Modal transparent visible={!!reactionMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReactionMessage(null)}>
          <TouchableWithoutFeedback>
            <View style={[styles.emojiSheet, isDark && styles.actionSheetDark]}>
              {['❤️', '👍', '😂', '🔥', '🎉'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.emojiBtn}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Forward Chat List Modal */}
      <Modal visible={isForwarding} animationType="slide" transparent>
        <View style={styles.forwardModalOverlay}>
          <View style={[styles.forwardModalContent, isDark && styles.forwardModalContentDark]}>
            <View style={styles.forwardModalHeader}>
              <Text style={[styles.forwardModalTitle, isDark && styles.textDark]}>Chatni tanlang</Text>
              <TouchableOpacity onPress={() => setIsForwarding(false)} style={{padding: 8}}>
                <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {Object.values(chats).map(chatItem => (
                <TouchableOpacity 
                  key={chatItem.id} 
                  style={[styles.forwardChatItem, isDark && styles.forwardChatItemDark]}
                  onPress={() => handleForwardTo(chatItem.id)}
                >
                  <View style={styles.forwardAvatar}><Text style={{color: '#FFF'}}>{chatItem.name.substring(0,2)}</Text></View>
                  <Text style={[styles.forwardChatName, isDark && styles.textDark]}>{chatItem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attachment Modal */}
      <Modal transparent visible={isAttachmentOpen} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAttachmentOpen(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.actionSheet, isDark && styles.actionSheetDark, { marginBottom: 80, alignSelf: 'center', width: '90%' }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsAttachmentOpen(false); pickImage(false); }}>
                <Text style={styles.actionBtnText}>🖼 Rasm yuborish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsAttachmentOpen(false); pickImage(true); }}>
                <Text style={styles.actionBtnText}>💣 1 marta ko'riladigan rasm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsAttachmentOpen(false); sendLocation(); }}>
                <Text style={styles.actionBtnText}>📍 Joylashuv yuborish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setIsAttachmentOpen(false); setIsCreatePollOpen(true); }}>
                <Text style={styles.actionBtnText}>📊 So'rovnoma yaratish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={() => { setIsAttachmentOpen(false); pickWallpaper(); }}>
                <Text style={styles.actionBtnText}>🖼 Fon rasmini o'zgartirish</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* View Once Image Modal */}
      <Modal visible={!!viewOnceImage} transparent animationType="fade">
        <View style={styles.fullScreenImageOverlay}>
          {viewOnceImage && (
            <>
              <Image source={{ uri: viewOnceImage.uri }} style={{width: '100%', height: '100%', resizeMode: 'contain'}} />
              <TouchableOpacity 
                style={styles.closeImageBtn} 
                onPress={() => {
                  markAsViewed(chatId, viewOnceImage.id);
                  setViewOnceImage(null);
                }}
              >
                <Text style={{color: '#FFF', fontSize: 18, fontWeight: 'bold'}}>Yopish (Boshqa ochilmaydi)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Create Poll Modal */}
      <Modal transparent visible={isCreatePollOpen} animationType="slide">
        <View style={styles.forwardModalOverlay}>
          <View style={[styles.forwardModalContent, isDark && styles.forwardModalContentDark, {height: '80%'}]}>
            <View style={styles.forwardModalHeader}>
              <Text style={[styles.forwardModalTitle, isDark && styles.textDark]}>So'rovnoma</Text>
              <TouchableOpacity onPress={() => setIsCreatePollOpen(false)} style={{padding: 8}}>
                <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{padding: 16}}>
              <Text style={{color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary, marginBottom: 8}}>Savol</Text>
              <TextInput 
                style={[styles.input, isDark && styles.inputDark, {marginBottom: 24}]} 
                placeholder="Savol bering..." 
                placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary} 
                value={pollQuestion} 
                onChangeText={setPollQuestion}
                color={isDark ? '#FFF' : '#000'}
              />
              
              <Text style={{color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary, marginBottom: 8}}>Variantlar</Text>
              {pollOptions.map((opt, i) => (
                <TextInput 
                  key={i}
                  style={[styles.input, isDark && styles.inputDark, {marginBottom: 12}]} 
                  placeholder={`Variant ${i+1}`} 
                  placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary} 
                  value={opt} 
                  onChangeText={(text) => {
                    const newOpts = [...pollOptions];
                    newOpts[i] = text;
                    setPollOptions(newOpts);
                  }}
                  color={isDark ? '#FFF' : '#000'}
                />
              ))}
              <TouchableOpacity 
                style={{padding: 12, alignItems: 'center'}} 
                onPress={() => setPollOptions([...pollOptions, ''])}
              >
                <Text style={{color: COLORS.primary}}>+ Variant qo'shish</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sendBtn, {backgroundColor: COLORS.primary}]} onPress={handleCreatePoll}>
                <Text style={{color: '#FFF', textAlign: 'center', fontSize: 16, fontWeight: 'bold'}}>Yaratish</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Schedule Message Modal */}
      <Modal transparent visible={isScheduleOpen} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsScheduleOpen(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.actionSheet, isDark && styles.actionSheetDark, { marginBottom: 80, alignSelf: 'center', width: '80%' }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleSchedule(10)}>
                <Text style={styles.actionBtnText}>⏱ 10 soniyadan so'ng jo'natish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={() => handleSchedule(60)}>
                <Text style={styles.actionBtnText}>⏱ 1 daqiqadan so'ng jo'natish</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: COLORS.bgLight, margin: 16, borderRadius: 14, overflow: 'hidden' },
  actionSheetDark: { backgroundColor: COLORS.headerDark },
  actionBtn: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight, alignItems: 'center' },
  actionBtnText: { fontSize: 18, color: COLORS.primary },
  
  emojiSheet: { backgroundColor: COLORS.bgLight, margin: 16, borderRadius: 30, padding: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', alignSelf: 'center', marginTop: '50%' },
  emojiBtn: { padding: 10 },
  emojiText: { fontSize: 32 },
  
  forwardModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  forwardModalContent: { backgroundColor: COLORS.bgLight, borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '60%' },
  forwardModalContentDark: { backgroundColor: COLORS.bgDark },
  forwardModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  forwardModalTitle: { fontSize: 18, fontWeight: 'bold' },
  forwardChatItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.separatorLight },
  forwardChatItemDark: { borderBottomColor: COLORS.separatorDark },
  forwardAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  forwardChatName: { fontSize: 18, fontWeight: '500' },
  
  fullScreenImageOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', bottom: 50, backgroundColor: COLORS.danger, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  
  textDark: { color: COLORS.textPrimaryDark },
  input: { backgroundColor: COLORS.inputBgLight, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  inputDark: { backgroundColor: COLORS.inputBgDark, color: '#FFF' },
  sendBtn: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 }
});
