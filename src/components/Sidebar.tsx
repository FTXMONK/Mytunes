import React, { useState, useEffect } from 'react';
import { Home, Search, Library, Plus, Music2, Heart, Users, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, logout } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Playlist } from '../types';

interface SidebarProps {
  className?: string;
  id?: string;
  activeView: 'home' | 'users' | 'playlist' | 'admin-songs' | 'library' | 'search';
  selectedPlaylistId?: string | null;
  setActiveView: (view: 'home' | 'users' | 'playlist' | 'admin-songs' | 'library' | 'search') => void;
  onSelectPlaylist: (id: string) => void;
}

export function Sidebar({ className, id, activeView, selectedPlaylistId, setActiveView, onSelectPlaylist }: SidebarProps) {
  const { user, isAdmin } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'playlists'), where('ownerId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist)));
    });
  }, [user]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) {
      setIsCreating(false);
      return;
    }
    try {
      await addDoc(collection(db, 'playlists'), {
        name: newPlaylistName,
        ownerId: user.uid,
        songIds: [],
        createdAt: serverTimestamp()
      });
      setNewPlaylistName('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id={id} className={cn("flex flex-col bg-black border-r border-white/5 h-full", className)}>
      <div className="p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <img src="https://i.postimg.cc/sX9SSZMf/IMG-2302.png" alt="TunesByMe Logo" className="w-10 h-10 object-contain" />
          <span className="font-bold text-xl tracking-tight">TunesByMe</span>
        </div>
        
        <nav className="flex flex-col gap-5">
          <NavItem 
            icon={<Home size={24} />} 
            label="Home" 
            active={activeView === 'home'} 
            onClick={() => setActiveView('home')}
          />
          <NavItem 
            icon={<Search size={24} />} 
            label="Search" 
            active={activeView === 'search'}
            onClick={() => setActiveView('search')}
          />
          <NavItem 
            icon={<Library size={24} />} 
            label="Your Library" 
            active={activeView === 'library'} 
            onClick={() => setActiveView('library')}
          />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/5 flex flex-col gap-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Admin Panel</span>
              <NavItem 
                icon={<Users size={24} />} 
                label="Manage Users" 
                active={activeView === 'users'} 
                onClick={() => setActiveView('users')}
              />
              <NavItem 
                icon={<Music2 size={24} />} 
                label="All Songs" 
                active={activeView === 'admin-songs'} 
                onClick={() => setActiveView('admin-songs')}
              />
            </div>
          )}
        </nav>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 text-zinc-500 hover:text-white transition cursor-pointer group">
          <p className="text-xs font-bold uppercase tracking-widest">Playlists</p>
          <Plus 
            size={18} 
            className="hover:bg-zinc-800 rounded-full p-0.5 transition-transform active:scale-90" 
            onClick={() => setIsCreating(true)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
          {isCreating && (
            <div className="flex flex-col gap-2 mb-4 animate-in slide-in-from-top-2 duration-200">
              <input 
                autoFocus
                className="bg-zinc-800 text-sm px-3 py-1.5 rounded outline-none border border-spotify-green/50 placeholder:text-zinc-600"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                onBlur={handleCreatePlaylist}
                onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              />
            </div>
          )}
          {playlists.map(playlist => (
            <div 
              key={playlist.id} 
              onClick={() => onSelectPlaylist(playlist.id)}
              className="text-sm text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2 group"
            >
              <span className={cn(
                "w-1 h-1 rounded-full bg-spotify-green transition-all",
                activeView === 'playlist' && playlist.id === selectedPlaylistId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )} />
              <span className="truncate">{playlist.name}</span>
            </div>
          ))}
          {playlists.length === 0 && (
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest text-center mt-4">No content</p>
          )}
        </div>
      </div>
      
      {user && (
        <div className="p-4 mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 border border-white/5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-spotify-green to-emerald-900 flex items-center justify-center text-xs font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Premium Member</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 p-2 text-zinc-500 hover:text-white transition group w-full rounded-lg hover:bg-white/5"
          >
            <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
            <span className="text-xs font-bold uppercase tracking-widest">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 cursor-pointer transition-all duration-200",
        active ? "text-spotify-green font-semibold" : "text-zinc-400 hover:text-white"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
