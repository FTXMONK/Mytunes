import React from 'react';
import { Sidebar } from './Sidebar';
import { PlayerBar } from './PlayerBar';
import { useAuth } from '../context/AuthContext';
import { Music2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export function Layout({ 
  children, 
  activeView, 
  setActiveView,
  onSelectPlaylist,
  selectedPlaylistId
}: { 
  children: React.ReactNode, 
  activeView: 'home' | 'users', 
  setActiveView: (view: 'home' | 'users' | 'playlist') => void,
  onSelectPlaylist: (id: string) => void,
  selectedPlaylistId?: string | null
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#090909] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-spotify-green border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090909] p-8 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spotify-green/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center text-center">
          <img src="https://i.postimg.cc/sX9SSZMf/IMG-2302.png" alt="Mytunes Logo" className="w-24 h-24 object-contain mb-6 drop-shadow-[0_0_20px_rgba(29,185,84,0.3)]" />
          <h1 className="mb-4 text-5xl font-black tracking-tight">Mytunes</h1>
          <p className="mb-10 text-zinc-400 text-lg max-w-sm">A new way to experience your music. Simple, fast, and local.</p>
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 rounded-full bg-white text-black px-10 py-4 font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-2xl"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white font-sans selection:bg-spotify-green/30">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          className="w-64" 
          id="main-sidebar" 
          activeView={activeView === 'users' ? 'users' : (activeView === 'home' ? 'home' : 'playlist')} 
          setActiveView={setActiveView} 
          onSelectPlaylist={onSelectPlaylist}
          selectedPlaylistId={selectedPlaylistId}
        />
        <main className="flex-1 overflow-hidden flex flex-col main-gradient">
          {children}
        </main>
      </div>
      <PlayerBar id="main-player" />
    </div>
  );
}
