import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  Volume2, VolumeX, ListMusic, MonitorSpeaker, Maximize2,
  Repeat1, Heart
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime, cn } from '../lib/utils';
import { motion } from 'motion/react';

export function PlayerBar({ id }: { id?: string }) {
  const { 
    currentSong, isPlaying, volume, currentTime, duration, repeatMode, isShuffled,
    togglePlay, nextSong, prevSong, setVolume, seek, setRepeatMode, toggleShuffle
  } = usePlayer();

  if (!currentSong) return <div id={id} className="h-[90px] bg-black" />;

  const progressPercent = (currentTime / duration) * 100 || 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return <Repeat1 size={20} className="text-spotify-green" />;
      case 'all': return <Repeat size={20} className="text-spotify-green" />;
      default: return <Repeat size={20} className="text-zinc-400 group-hover:text-white transition" />;
    }
  };

  const cycleRepeat = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  return (
    <div id={id} className="h-[90px] bg-black border-t border-white/10 px-4 flex items-center justify-between z-20 select-none">
      {/* Song Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
        <div className="w-14 h-14 bg-emerald-600 rounded shadow-lg overflow-hidden flex-shrink-0">
           <div className="w-full h-full bg-gradient-to-tr from-spotify-green to-emerald-400 flex items-center justify-center font-bold text-black border border-white/10">
             {currentSong.title?.[0].toUpperCase()}
           </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold hover:underline cursor-pointer truncate">{currentSong.title}</span>
          <span className="text-xs text-zinc-400 hover:underline hover:text-white cursor-pointer truncate">{currentSong.artist}</span>
        </div>
        <button className="ml-2 text-zinc-400 hover:text-spotify-green transition">
          <Heart size={18} />
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[40%]">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleShuffle}
            className={cn("hover:scale-110 transition-transform", isShuffled ? "text-spotify-green" : "text-zinc-400 hover:text-white")}
          >
            <Shuffle size={18} />
          </button>
          <button onClick={prevSong} className="text-zinc-400 hover:text-white transition-all transform active:scale-90">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-md"
          >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
          </button>
          <button onClick={nextSong} className="text-zinc-400 hover:text-white transition-all transform active:scale-90">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button onClick={cycleRepeat} className="hover:scale-110 transition-transform group">
            {getRepeatIcon()}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-zinc-400 w-8 text-right font-medium">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full group cursor-pointer relative flex items-center">
            <input 
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
            />
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="absolute h-full bg-spotify-green rounded-full group-hover:bg-[#1ed760] transition-colors"
            />
            <div 
              style={{ left: `${progressPercent}%` }} 
              className="hidden group-hover:block absolute w-3 h-3 bg-white rounded-full shadow-lg -translate-x-1/2 z-10"
            />
          </div>
          <span className="text-[10px] text-zinc-400 w-8 font-medium">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end gap-4 w-[30%] min-w-[200px]">
        <ListMusic size={18} className="text-zinc-400 hover:text-white transition cursor-pointer" />
        <MonitorSpeaker size={18} className="text-zinc-400 hover:text-white transition cursor-pointer" />
        
        <div className="flex items-center gap-2 group w-24">
          {volume === 0 ? <VolumeX size={18} className="text-zinc-400" /> : <Volume2 size={18} className="text-zinc-400 group-hover:text-white transition" />}
          <div className="flex-1 h-1 bg-zinc-800 rounded-full cursor-pointer relative group-hover:bg-zinc-700 transition flex items-center">
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
            />
            <div 
              style={{ width: `${volume * 100}%` }} 
              className="absolute h-full bg-white group-hover:bg-spotify-green rounded-full transition-colors"
            />
          </div>
        </div>
        <Maximize2 size={16} className="text-zinc-400 hover:text-white transition cursor-pointer" />
      </div>
    </div>
  );
}
