import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground, Modal, Alert, Image, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { TimezoneSelector } from '../components/settings/TimezoneSelector';
import { TimezoneBadge } from '../components/chat/TimezoneBadge';
import { ReminderCard } from '../components/chat/ReminderCard';
import { SmartReplySuggestions } from '../components/chat/SmartReplySuggestions';
import { detectReminderIntent } from '../utils/reminderHelper';
import { useUserStore } from '../store/useUserStore';

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, chatName } = route.params;
  const { user, settings, chats, addMessage, deleteMessage, editMessage, addReaction, setWallpaper, translateMessage, votePoll, markAsViewed } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const currentChat = chats[chatId] || { messages: [] };
  const messages = currentChat.messages;

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Tahrirlash (Edit) holati
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Long-press menyusi (ActionSheet modal simulyatsiyasi)
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Reaction picker holati
  const [reactionMessage, setReactionMessage] = useState(null);

  // Qidiruv holati (3-bosqich)
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Forward (Yo'naltirish) holati
  const [isForwarding, setIsForwarding] = useState(false);

  // Ovozli xabar holati
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [playingAudioId, setPlayingAudioId] = useState(null);

  // Attachment va Poll (So'rovnoma) holati
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [viewOnceImage, setViewOnceImage] = useState(null); // {id, uri} yoki null
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Soundni tozalash
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const handleSend = () => {
    if (inputText.trim()) {
      if (editingMessage) {
        // Tahrirlash
        editMessage(chatId, editingMessage.id, inputText);
        setEditingMessage(null);
      } else {
        // Yangi xabar
        const newMessage = { 
          id: Date.now().toString(), 
          text: inputText, 
          sender: 'me', 
          time: 'Hozir',
          replyTo: replyingTo ? replyingTo.id : null,
          replyToText: replyingTo ? replyingTo.text : null,
          replyToSender: replyingTo ? replyingTo.sender : null,
          reactions: {}
        };
        addMessage(chatId, newMessage);
      }
      setInputText('');
      setReplyingTo(null);
    }
  };

  const handleAction = (action) => {
    if (!selectedMessage) return;
    
    switch (action) {
      case 'reply':
        setReplyingTo(selectedMessage);
        break;
      case 'edit':
        if (selectedMessage.sender === 'me') {
          setEditingMessage(selectedMessage);
          setInputText(selectedMessage.text);
        }
        break;
      case 'delete':
        deleteMessage(chatId, selectedMessage.id);
        break;
      case 'react':
        setReactionMessage(selectedMessage);
        break;
      case 'forward':
        setIsForwarding(true);
        break;
      case 'translate':
        translateMessage(chatId, selectedMessage.id);
        break;
    }
    if (action !== 'forward') {
      setSelectedMessage(null);
    }
  };

  const handleForwardTo = (targetChatId) => {
    if (selectedMessage) {
      addMessage(targetChatId, {
        id: Date.now().toString(),
        text: selectedMessage.text,
        sender: 'me',
        time: 'Hozir',
        isForwarded: true,
        forwardedFrom: selectedMessage.sender === 'me' ? 'Siz' : chatName,
        reactions: {}
      });
      setIsForwarding(false);
      setSelectedMessage(null);
      
      Alert.alert('Muvaffaqiyatli', 'Xabar yo\'naltirildi!');
    }
  };

  const pickImage = async (isViewOnce = false) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMessage = { 
        id: Date.now().toString(), 
        text: '', 
        imageUrl: result.assets[0].uri,
        isViewOnce,
        isViewed: false,
        sender: 'me', 
        time: 'Hozir',
        reactions: {}
      };
      addMessage(chatId, newMessage);
    }
  };

  const sendLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Xatolik', 'Joylashuvga ruxsat berilmadi');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const newMessage = {
        id: Date.now().toString(),
        text: '',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        sender: 'me',
        time: 'Hozir',
        reactions: {}
      };
      addMessage(chatId, newMessage);
    } catch (e) {
      Alert.alert('Xatolik', 'Joylashuvni aniqlab bo\'lmadi');
    }
  };

  const handleSchedule = (seconds) => {
    const textToSchedule = inputText.trim();
    if (!textToSchedule) return;
    
    setIsScheduleOpen(false);
    setInputText('');
    Alert.alert('Rejalashtirildi', `Xabaringiz ${seconds} soniyadan so'ng yuboriladi.`);
    
    setTimeout(() => {
      const newMessage = { 
        id: Date.now().toString(), 
        text: textToSchedule, 
        sender: 'me', 
        time: 'Hozir',
        reactions: {}
      };
      addMessage(chatId, newMessage);
    }, seconds * 1000);
  };

  const handleCreatePoll = () => {
    if (pollQuestion.trim() && pollOptions[0].trim() && pollOptions[1].trim()) {
      const newPoll = {
        id: Date.now().toString(),
        type: 'poll',
        question: pollQuestion,
        options: pollOptions.filter(o => o.trim()).map(opt => ({ text: opt, votes: 0 })),
        votedByMe: null,
        sender: 'me',
        time: 'Hozir',
        reactions: {}
      };
      addMessage(chatId, newPoll);
      setIsCreatePollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } else {
      Alert.alert('Xatolik', 'Savol va kamida 2 ta variant kiriting');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert('Xatolik', 'Mikrofonga ruxsat bering');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    if (uri) {
      const newMessage = { 
        id: Date.now().toString(), 
        text: '', 
        audioUrl: uri,
        sender: 'me', 
        time: 'Hozir',
        reactions: {}
      };
      addMessage(chatId, newMessage);
    }
  };

  const playSound = async (uri, msgId) => {
    if (sound) {
      await sound.unloadAsync();
      setPlayingAudioId(null);
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    setSound(newSound);
    setPlayingAudioId(msgId);
    
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setPlayingAudioId(null);
      }
    });
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingAudioId(null);
    }
  };

  const handleReaction = (emoji) => {
    if (reactionMessage) {
      addReaction(chatId, reactionMessage.id, emoji);
      setReactionMessage(null);
    }
  };

  const lastIncomingMessage = messages.filter(m => m.sender === 'them').pop();

  // Qidiruv filtri
  const displayMessages = messages.filter(msg => 
    isSearching && searchQuery.trim() !== '' 
      ? msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 8, marginLeft: -8}}>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>‹ Ortga</Text>
          </TouchableOpacity>
          
          {isSearching ? (
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Qidiruv..."
              placeholderTextColor={isDark ? '#888' : '#C7C7CC'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          ) : (
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>{chatName}</Text>
          )}

          <TouchableOpacity onPress={() => { setIsSearching(!isSearching); setSearchQuery(''); }} style={{padding: 8}}>
            <Text style={{fontSize: 18, color: isDark ? '#FFF' : '#000'}}>{isSearching ? '✕' : '🔍'}</Text>
          </TouchableOpacity>
        </View>
        {!isSearching && (
          <View style={styles.headerControls}>
            <TimezoneSelector />
            <TouchableOpacity 
              style={styles.wallpaperBtn} 
              onPress={() => setWallpaper(settings.wallpaper ? null : 'https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')}
            >
              <Text style={styles.wallpaperBtnText}>{settings.wallpaper ? 'Fonni o\'chirish' : 'Fonni o\'zgartirish'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Chat Area */}
      <ImageBackground 
        source={settings.wallpaper ? { uri: settings.wallpaper } : null} 
        style={[styles.chatArea, isDark && !settings.wallpaper ? styles.chatAreaDark : null]}
        imageStyle={{ opacity: isDark ? 0.5 : 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Chat header'dagi timezone badge */}
        {chatId !== 'saved' && (
          <View style={styles.chatProfileHeader}>
            <Text style={[styles.chatName, isDark && styles.textDark, settings.wallpaper && {color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4}]}>{chatName}</Text>
            <TimezoneBadge timezone={user.timezone || 'Asia/Tashkent'} isDarkMode={isDark} />
          </View>
        )}

        {displayMessages.map(msg => {
          const isThem = msg.sender === 'them';
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          
          return (
            <View key={msg.id} style={{ marginBottom: 16 }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onLongPress={() => setSelectedMessage(msg)}
                delayLongPress={300}
                style={[styles.bubble, isThem ? (isDark ? styles.bubbleThemDark : styles.bubbleThem) : styles.bubbleMe]}
              >
                {/* Reply info ko'rsatish */}
                {msg.replyToText && (
                  <View style={[styles.replyBoxInBubble, isThem ? (isDark ? styles.replyBoxThemDark : styles.replyBoxThem) : styles.replyBoxMe]}>
                    <Text style={[styles.replySenderInBubble, isThem ? styles.replySenderThem : styles.replySenderMe]}>
                      {msg.replyToSender === 'me' ? 'Siz' : 'Suhbatdosh'}
                    </Text>
                    <Text numberOfLines={1} style={[styles.replyTextInBubble, isThem ? (isDark ? styles.textDark : {color: '#000'}) : styles.textMe]}>
                      {msg.replyToText}
                    </Text>
                  </View>
                )}
                <Text style={isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe}>{msg.text}</Text>
                
                {/* Forward info */}
                {msg.isForwarded && (
                  <Text style={[styles.forwardedText, isThem ? null : {color: '#E0E0E0'}]}>
                    Forwarded from {msg.forwardedFrom}
                  </Text>
                )}

                {/* Rasm mavjud bo'lsa */}
                {msg.imageUrl && !msg.isViewOnce && (
                  <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
                )}

                {/* 1 marta ko'riladigan rasm mavjud bo'lsa */}
                {msg.imageUrl && msg.isViewOnce && (
                  <TouchableOpacity 
                    style={[styles.viewOnceBtn, isThem && !isDark && {borderColor: '#0088CC'}]}
                    onPress={() => {
                      if (!msg.isViewed) {
                        setViewOnceImage({ id: msg.id, uri: msg.imageUrl });
                      }
                    }}
                    disabled={msg.isViewed}
                  >
                    <Text style={{fontSize: 20, marginRight: 8}}>💣</Text>
                    <Text style={{color: isThem ? (isDark ? '#FFF' : '#0088CC') : '#FFF', fontWeight: 'bold'}}>
                      {msg.isViewed ? 'Ochilgan' : '1 marta ko\'rish'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Joylashuv (Location) mavjud bo'lsa */}
                {msg.location && (
                  <TouchableOpacity 
                    style={styles.locationContainer}
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`)}
                  >
                    <Text style={{fontSize: 30, textAlign: 'center'}}>📍</Text>
                    <Text style={{color: isThem ? (isDark ? '#888' : '#0088CC') : '#FFF', marginTop: 4, fontWeight: 'bold'}}>Xaritada ochish</Text>
                  </TouchableOpacity>
                )}

                {/* Ovozli xabar mavjud bo'lsa */}
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

                {/* So'rovnoma (Poll) mavjud bo'lsa */}
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

                {msg.text ? <Text style={isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe}>{msg.text}</Text> : null}
                
                {/* Tarjima qilingan matn */}
                {msg.translatedText && (
                  <View style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.3)'}}>
                    <Text style={[isThem ? (isDark ? styles.textDark : styles.textThem) : styles.textMe, {fontStyle: 'italic', fontSize: 14}]}>
                      {msg.translatedText}
                    </Text>
                  </View>
                )}
                
                {/* Vaqt va Edit status */}
                <View style={styles.timeRow}>
                  {msg.isEdited && <Text style={[styles.editedText, isThem ? null : {color: '#E0E0E0'}]}>edited </Text>}
                  <Text style={[styles.msgTime, isThem ? (isDark ? {color: '#888'} : null) : {color: '#E0E0E0'}]}>{msg.time}</Text>
                </View>

                {/* Emojilar ko'rsatkichi */}
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
              
              {/* Eslatma qo'shish kartasi (MCR) */}
              {isThem && detectReminderIntent(msg.text) && (
                <ReminderCard 
                  messageText={msg.text} 
                  onDismiss={() => {}} 
                />
              )}
            </View>
          );
        })}
        </ScrollView>
      </ImageBackground>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          
          {/* Reply Bar */}
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

          {/* Edit Bar */}
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

          {/* Aqlli javob takliflari (SR) */}
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
                onPress={recording ? stopRecording : startRecording}
              >
                <Text style={{fontSize: 20}}>{recording ? '🔴' : '🎙'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Message Action Menu Modal */}
      <Modal transparent visible={!!selectedMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMessage(null)}>
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
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('delete')}>
              <Text style={[styles.actionBtnText, {color: '#FF3B30'}]}>O'chirish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Emoji Reaction Modal */}
      <Modal transparent visible={!!reactionMessage} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReactionMessage(null)}>
          <View style={[styles.emojiSheet, isDark && styles.actionSheetDark]}>
            {['❤️', '👍', '😂', '🔥', '🎉'].map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
              {Object.values(chats).map(chat => (
                <TouchableOpacity 
                  key={chat.id} 
                  style={[styles.forwardChatItem, isDark && styles.forwardChatItemDark]}
                  onPress={() => handleForwardTo(chat.id)}
                >
                  <View style={styles.forwardAvatar}><Text style={{color: '#FFF'}}>{chat.name.substring(0,2)}</Text></View>
                  <Text style={[styles.forwardChatName, isDark && styles.textDark]}>{chat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attachment Modal */}
      <Modal transparent visible={isAttachmentOpen} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAttachmentOpen(false)}>
          <View style={[styles.actionSheet, isDark && styles.actionSheetDark, { marginBottom: 80, alignSelf: 'center' }]}>
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
          </View>
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
              <Text style={{color: isDark ? '#888' : '#888', marginBottom: 8}}>Savol</Text>
              <TextInput 
                style={[styles.input, isDark && styles.inputDark, {marginBottom: 24}]} 
                placeholder="Savol bering..." 
                placeholderTextColor="#888" 
                value={pollQuestion} 
                onChangeText={setPollQuestion}
                color={isDark ? '#FFF' : '#000'}
              />
              
              <Text style={{color: isDark ? '#888' : '#888', marginBottom: 8}}>Variantlar</Text>
              {pollOptions.map((opt, i) => (
                <TextInput 
                  key={i}
                  style={[styles.input, isDark && styles.inputDark, {marginBottom: 12}]} 
                  placeholder={`Variant ${i+1}`} 
                  placeholderTextColor="#888" 
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
                <Text style={{color: '#0088CC'}}>+ Variant qo'shish</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sendBtn, {backgroundColor: '#0088CC', borderRadius: 8, marginTop: 24}]} onPress={handleCreatePoll}>
                <Text style={{color: '#FFF', textAlign: 'center', fontSize: 16, fontWeight: 'bold'}}>Yaratish</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Schedule Message Modal */}
      <Modal transparent visible={isScheduleOpen} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsScheduleOpen(false)}>
          <View style={[styles.actionSheet, isDark && styles.actionSheetDark, { marginBottom: 80, alignSelf: 'center' }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleSchedule(10)}>
              <Text style={styles.actionBtnText}>⏱ 10 soniyadan so'ng jo'natish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleSchedule(60)}>
              <Text style={styles.actionBtnText}>⏱ 1 daqiqadan so'ng jo'natish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerDark: { backgroundColor: '#1C1C1E', borderBottomColor: '#38383A' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' },
  headerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 12, fontSize: 16 },
  searchInputDark: { backgroundColor: '#2C2C2E', color: '#FFF' },
  wallpaperBtn: { padding: 8, backgroundColor: '#E5E5EA', borderRadius: 8 },
  wallpaperBtnText: { color: '#0088CC', fontWeight: '600', fontSize: 12 },
  textDark: { color: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  chatArea: { flex: 1, backgroundColor: '#F7F7F8' },
  chatAreaDark: { backgroundColor: '#000000' },
  chatProfileHeader: { alignItems: 'center', marginBottom: 24 },
  chatName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleThem: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleThemDark: { backgroundColor: '#2C2C2E', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#0088CC', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  textThem: { color: '#000', fontSize: 16 },
  textMe: { color: '#FFF', fontSize: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, alignItems: 'center' },
  msgTime: { fontSize: 11, color: '#8E8E93' },
  editedText: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' },
  forwardedText: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', marginTop: 2 },
  messageImage: { width: 220, height: 220, borderRadius: 8, marginBottom: 4, backgroundColor: 'rgba(0,0,0,0.1)' },
  inputContainer: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: Platform.OS === 'ios' ? 0 : 16 },
  inputContainerDark: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
  inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  attachBtn: { padding: 8, marginRight: 4 },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  inputDark: { backgroundColor: '#2C2C2E' },
  sendBtn: { marginLeft: 12, padding: 10 },
  sendBtnText: { color: '#0088CC', fontWeight: '600', fontSize: 16 },
  micBtn: { marginLeft: 8, padding: 10, justifyContent: 'center', alignItems: 'center' },
  audioContainer: { flexDirection: 'row', alignItems: 'center', width: 200, paddingVertical: 4 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  audioWaveform: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waveLine: { width: 3, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 },
  replyBar: { flexDirection: 'row', padding: 12, backgroundColor: '#F7F7F8', borderTopWidth: 1, borderTopColor: '#E5E5EA', borderLeftWidth: 3, borderLeftColor: '#0088CC' },
  replyBarDark: { backgroundColor: '#1C1C1E', borderTopColor: '#38383A' },
  replyBarContent: { flex: 1 },
  replyBarTitle: { color: '#0088CC', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  replyBarText: { color: '#333', fontSize: 14 },
  replyBarClose: { padding: 4, justifyContent: 'center' },
  replyBarCloseText: { color: '#888', fontSize: 18 },
  replyBoxInBubble: { paddingLeft: 8, borderLeftWidth: 2, marginBottom: 6, paddingVertical: 2 },
  replyBoxThem: { borderLeftColor: '#0088CC', backgroundColor: 'rgba(0,136,204,0.1)', borderRadius: 4 },
  replyBoxThemDark: { borderLeftColor: '#0088CC', backgroundColor: 'rgba(0,136,204,0.2)', borderRadius: 4 },
  replyBoxMe: { borderLeftColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  replySenderThem: { color: '#0088CC', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  replySenderMe: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  actionSheet: { width: 250, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  actionSheetDark: { backgroundColor: '#2C2C2E' },
  actionBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', alignItems: 'center' },
  actionBtnText: { fontSize: 16, color: '#0088CC' },
  
  // Emoji styles
  emojiSheet: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 30 },
  emojiBtn: { marginHorizontal: 8 },
  emojiText: { fontSize: 32 },
  reactionsContainer: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  reactionBadge: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 4 },
  reactionText: { fontSize: 12 },

  // Forward Modal styles
  forwardModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  forwardModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', paddingBottom: 30 },
  forwardModalContentDark: { backgroundColor: '#1C1C1E' },
  forwardModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  forwardModalTitle: { fontSize: 18, fontWeight: 'bold' },
  forwardChatItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'center' },
  forwardChatItemDark: { borderBottomColor: '#2C2C2E' },
  forwardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0088CC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  forwardChatName: { fontSize: 16, fontWeight: '500' },

  // Poll styles
  pollContainer: { minWidth: 200, paddingVertical: 8 },
  pollQuestion: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  pollOptionBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, marginBottom: 8, overflow: 'hidden', position: 'relative', minHeight: 36, justifyContent: 'center' },
  pollOptionProgress: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,136,204,0.3)' },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  pollOptionText: { fontSize: 14, color: '#000' },
  pollPercentText: { fontSize: 12, color: '#555' },
  pollTotalVotes: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' },

  // View once
  viewOnceBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 12 },
  fullScreenImageOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', bottom: 50, padding: 16, backgroundColor: 'rgba(255,0,0,0.8)', borderRadius: 24 },

  // Location
  locationContainer: { padding: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
