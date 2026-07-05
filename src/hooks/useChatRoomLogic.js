import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/useUserStore';

export function useChatRoomLogic(chatId, chatName) {
  const { chats, settings, addMessage, deleteMessage, editMessage, translateMessage, markAsViewed, markAsRead, votePoll, addReaction, setChatWallpaper } = useUserStore();
  
  const chat = chats[chatId] || { messages: [], wallpaper: null };
  const isDark = settings.theme === 'dark';
  
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState('audio');
  const cameraRef = useRef(null);
  const swipeableRefs = useRef({});
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reactionMessage, setReactionMessage] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [sound, setSound] = useState();
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [viewOnceImage, setViewOnceImage] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Mark all incoming messages as read when chat is opened
  useEffect(() => {
    const unreadMessages = chat.messages.filter(m => m.sender === 'them' && !m.isRead);
    if (unreadMessages.length > 0) {
      markAsRead(chatId);
    }
  }, [chat.messages, chatId, markAsRead]);

  const handleSend = () => {
    if (inputText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (editingMessage) {
        editMessage(chatId, editingMessage.id, inputText);
        setEditingMessage(null);
      } else {
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
        
        // Simulate typing indicator
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
      setInputText('');
      setReplyingTo(null);
    }
  };

  const pickWallpaper = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setChatWallpaper(chatId, result.assets[0].uri);
    }
  };

  const handleAction = (action) => {
    if (!selectedMessage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case 'reply': setReplyingTo(selectedMessage); break;
      case 'edit':
        if (selectedMessage.sender === 'me') {
          setEditingMessage(selectedMessage);
          setInputText(selectedMessage.text);
        }
        break;
      case 'delete': deleteMessage(chatId, selectedMessage.id); break;
      case 'react': setReactionMessage(selectedMessage); break;
      case 'forward': setIsForwarding(true); break;
      case 'translate': translateMessage(chatId, selectedMessage.id); break;
    }
    if (action !== 'forward') setSelectedMessage(null);
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
        location: { latitude: location.coords.latitude, longitude: location.coords.longitude },
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
      setPollOptions(['', '']);
    } else {
      Alert.alert('Xatolik', 'Savol va kamida 2 ta variant kiriting');
    }
  };

  const toggleRecordMode = () => setRecordMode(prev => prev === 'audio' ? 'video' : 'audio');

  const recordingRef = useRef(null);
  const isPreparingRef = useRef(false);

  const startRecording = async () => {
    try {
      if (recordMode === 'audio') {
        if (isPreparingRef.current || recordingRef.current) return;
        isPreparingRef.current = true;
        
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          isPreparingRef.current = false;
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await newRecording.startAsync();
        
        recordingRef.current = newRecording;
        setRecording(newRecording);
        setIsRecording(true);
        isPreparingRef.current = false;
      } else {
        if (!cameraPermission?.granted) await requestCameraPermission();
        if (!microphonePermission?.granted) await requestMicrophonePermission();
        setIsRecording(true);
        // Video recording will be started by onCameraReady in ChatInputArea
      }
    } catch (err) {
      isPreparingRef.current = false;
      console.error('Recording failed', err);
    }
  };

  const startVideoRecording = () => {
    if (cameraRef.current && isRecording && recordMode === 'video') {
      cameraRef.current.recordAsync().then(videoRecord => {
        if (videoRecord) {
          const newMessage = { id: Date.now().toString(), text: '', videoUrl: videoRecord.uri, sender: 'me', time: 'Hozir', reactions: {} };
          addMessage(chatId, newMessage);
        }
      }).catch(err => console.log('Video recording error', err));
    }
  };

  const stopRecording = async () => {
    if (recordMode === 'audio') {
      setIsRecording(false);
      const activeRecording = recordingRef.current || recording;
      if (!activeRecording) return;
      
      try {
        await activeRecording.stopAndUnloadAsync();
        const uri = activeRecording.getURI();
        recordingRef.current = null;
        setRecording(null);
        if (uri) {
          const newMessage = { id: Date.now().toString(), text: '', audioUrl: uri, sender: 'me', time: 'Hozir', reactions: {} };
          addMessage(chatId, newMessage);
        }
      } catch(e) {
        recordingRef.current = null;
        setRecording(null);
      }
    } else {
      setIsRecording(false);
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
    }
  };

  const playSound = async (uri, msgId) => {
    if (sound) {
      await sound.unloadAsync();
      setPlayingAudioId(null);
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    setSound(newSound);
    setPlayingAudioId(msgId);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) setPlayingAudioId(null);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addReaction(chatId, reactionMessage.id, emoji);
      setReactionMessage(null);
    }
  };

  let lastIncomingMessage = chat.messages.filter(m => m.sender === 'them').pop();
  if (lastIncomingMessage && lastIncomingMessage.isEncrypted) {
    try {
      const { mockDecrypt } = require('../store/useUserStore');
      lastIncomingMessage = { ...lastIncomingMessage, text: mockDecrypt(lastIncomingMessage.text) };
    } catch (e) {
      console.error('Decryption failed for smart reply');
    }
  }

  return {
    chat, chats, isDark, settings,
    inputText, setInputText, replyingTo, setReplyingTo, editingMessage, setEditingMessage,
    recording, isRecording, recordMode, toggleRecordMode, startRecording, stopRecording, startVideoRecording, cameraRef,
    swipeableRefs, selectedMessage, setSelectedMessage, reactionMessage, setReactionMessage,
    isSearching, setIsSearching, searchQuery, setSearchQuery, isForwarding, setIsForwarding,
    playingAudioId, playSound, stopSound, isAttachmentOpen, setIsAttachmentOpen,
    isCreatePollOpen, setIsCreatePollOpen, pollQuestion, setPollQuestion, pollOptions, setPollOptions,
    viewOnceImage, setViewOnceImage, isScheduleOpen, setIsScheduleOpen,
    handleSend, pickWallpaper, handleAction, handleForwardTo, pickImage, sendLocation,
    handleSchedule, handleCreatePoll, handleReaction, markAsViewed, votePoll, lastIncomingMessage, chatId, chatName,
    isTyping, cameraPermission, requestCameraPermission, microphonePermission, requestMicrophonePermission
  };
}
