import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AudioContext = createContext(null);

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  // Core audio state that persists across component mounts
  const [currentAudio, setCurrentAudio] = useState(null); // { songId, url, filename, size, duration }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Reference to the actual WaveSurfer instance (set by the active AudioPlayer)
  const waveSurferRef = useRef(null);
  const audioSourceRef = useRef(null); // Track which component is controlling audio

  // Register a WaveSurfer instance as the active player
  const registerWaveSurfer = useCallback((ws, source) => {
    waveSurferRef.current = ws;
    audioSourceRef.current = source;
  }, []);

  // Unregister when component unmounts
  const unregisterWaveSurfer = useCallback((source) => {
    if (audioSourceRef.current === source) {
      // Don't clear the ref - let another component take over
      // waveSurferRef.current = null;
      // audioSourceRef.current = null;
    }
  }, []);

  // Play audio for a specific song
  const playAudio = useCallback((songId, audioData) => {
    // If same song, just toggle play/pause
    if (currentAudio?.songId === songId && waveSurferRef.current) {
      if (isPlaying) {
        waveSurferRef.current.pause();
      } else {
        waveSurferRef.current.play();
      }
      return;
    }

    // Different song - update current audio
    setCurrentAudio({
      songId,
      url: audioData.url,
      filename: audioData.filename,
      size: audioData.size,
      duration: audioData.duration
    });
    setCurrentTime(0);
    setIsPlaying(false); // Will be set to true when WaveSurfer starts playing
  }, [currentAudio, isPlaying]);

  // Stop and clear audio
  const stopAudio = useCallback(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.pause();
      waveSurferRef.current.seekTo(0);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Update playback state (called by AudioPlayer)
  const updatePlaybackState = useCallback((state) => {
    if (state.isPlaying !== undefined) setIsPlaying(state.isPlaying);
    if (state.currentTime !== undefined) setCurrentTime(state.currentTime);
    if (state.duration !== undefined) setDuration(state.duration);
    if (state.volume !== undefined) setVolume(state.volume);
    if (state.isMuted !== undefined) setIsMuted(state.isMuted);
  }, []);

  // Sync state to WaveSurfer when it changes
  const syncToWaveSurfer = useCallback(() => {
    if (!waveSurferRef.current) return null;

    return {
      currentTime,
      duration,
      isPlaying,
      volume,
      isMuted
    };
  }, [currentTime, duration, isPlaying, volume, isMuted]);

  const value = {
    // State
    currentAudio,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,

    // Actions
    playAudio,
    stopAudio,
    setCurrentAudio,
    updatePlaybackState,
    syncToWaveSurfer,

    // WaveSurfer management
    registerWaveSurfer,
    unregisterWaveSurfer,
    waveSurferRef
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;
