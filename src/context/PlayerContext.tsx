import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Song, RepeatMode } from '../types';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  activeQueue: Song[];
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeQueue, setActiveQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  const updateProgress = () => {
    if (howlRef.current && isPlaying) {
      setCurrentTime(howlRef.current.seek() as number);
      requestAnimationFrame(updateProgress);
    }
  };

  const playSong = (song: Song, queue: Song[] = []) => {
    cleanup();
    
    if (queue.length > 0) {
      setActiveQueue(queue);
      const index = queue.findIndex(s => s.id === song.id);
      setCurrentIndex(index);
    }

    const howl = new Howl({
      src: [song.audioUrl],
      html5: true,
      volume: volume,
      onplay: () => {
        setIsPlaying(true);
        setDuration(howl.duration());
        requestAnimationFrame(updateProgress);
      },
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => {
        handleEnd();
      }
    });

    howlRef.current = howl;
    setCurrentSong(song);
    howl.play();
  };

  const handleEnd = () => {
    if (repeatMode === 'one') {
      howlRef.current?.play();
      return;
    }
    nextSong();
  };

  const togglePlay = () => {
    if (!howlRef.current) return;
    if (howlRef.current.playing()) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  };

  const nextSong = () => {
    if (activeQueue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= activeQueue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    playSong(activeQueue[nextIdx], activeQueue);
  };

  const prevSong = () => {
    if (activeQueue.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = activeQueue.length - 1;
      } else {
        howlRef.current?.seek(0);
        return;
      }
    }
    playSong(activeQueue[prevIdx], activeQueue);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    // In a real app, you'd shuffle the actual queue state here
  };

  const seek = (time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong, isPlaying, activeQueue, currentIndex, repeatMode, 
      isShuffled, volume, currentTime, duration,
      playSong, togglePlay, nextSong, prevSong, setRepeatMode, toggleShuffle, setVolume, seek
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
