import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

export function useAudioRecorder(chatId, addMessage) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState('audio'); // 'audio' or 'video'
  
  const cameraRef = useRef(null);
  const recordingRef = useRef(null);
  const isPreparingRef = useRef(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const toggleRecordMode = () => setRecordMode(prev => prev === 'audio' ? 'video' : 'audio');

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

  return {
    recording,
    isRecording,
    recordMode,
    toggleRecordMode,
    startRecording,
    stopRecording,
    startVideoRecording,
    cameraRef,
    cameraPermission,
    requestCameraPermission,
    microphonePermission,
    requestMicrophonePermission
  };
}
