import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Playlist, Song } from '../types';
import { Play, Clock, Upload, X, Edit2, Trash2, Camera, Music2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!playlistId) return;
    return onSnapshot(doc(db, 'playlists', playlistId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Playlist;
        setPlaylist({ id: doc.id, ...data });
        setNewName(data.name);
      }
    });
  }, [playlistId]);

  useEffect(() => {
    if (!playlist?.songIds || playlist.songIds.length === 0) {
      setSongs([]);
      return;
    }
    
    // Fetch songs in playlist
    // Firestore 'in' query has a limit of 10-30 depending on version, 
    // but for this MVP it's fine.
    const fetchSongs = async () => {
      const q = query(collection(db, 'songs'), where('__name__', 'in', playlist.songIds));
      const snap = await getDocs(q);
      const fetchedSongs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
      // Sort to match playlist order
      const orderedSongs = playlist.songIds
        .map(id => fetchedSongs.find(s => s.id === id))
        .filter((s): s is Song => !!s);
      setSongs(orderedSongs);
    };
    fetchSongs();
  }, [playlist?.songIds]);

  const handleRename = async () => {
    if (!playlist || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), { name: newName });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playlist || !user) return;

    setUploadingCover(true);
    try {
      const storageRef = ref(storage, `playlists/${playlist.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'playlists', playlist.id), { coverUrl: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCover(false);
    }
  };

  if (!playlist) return null;

  return (
    <div className="flex flex-col flex-1 relative h-full">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1DB954]/10 to-transparent pointer-events-none" />

      <div className="px-8 py-8 z-10 flex flex-col pt-16">
        <div className="flex items-end gap-6 mb-8">
          <div className="relative group">
            <div className="w-52 h-52 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden flex-shrink-0 bg-[#282828] flex items-center justify-center">
              {playlist.coverUrl ? (
                <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
              ) : (
                <Music2 size={80} className="text-zinc-700" />
              )}
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-spotify-green border-t-transparent" />
                </div>
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-lg">
              <Camera size={32} />
              <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          <div className="flex flex-col gap-2 pb-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#b3b3b3]">Playlist</span>
            {isEditing ? (
              <div className="flex items-center gap-4">
                <input 
                  autoFocus
                  className="text-7xl font-black bg-transparent border-b border-white outline-none w-full tracking-tighter"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                />
              </div>
            ) : (
              <h1 
                className="text-7xl font-black mb-2 tracking-tighter cursor-pointer hover:text-white transition group flex items-baseline gap-4"
                onClick={() => setIsEditing(true)}
              >
                {playlist.name}
                <Edit2 size={24} className="opacity-0 group-hover:opacity-100 text-zinc-500" />
              </h1>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="text-white">{user?.displayName}</span> • {songs.length} songs
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 text-zinc-400 text-[10px] font-bold border-b border-white/10 uppercase tracking-widest mb-4">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <div className="flex justify-center"><Clock size={14} /></div>
          </div>

          <div className="space-y-1">
            {songs.map((song, index) => (
              <div 
                key={song.id} 
                onDoubleClick={() => playSong(song, songs)}
                className="grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 transition-all group items-center cursor-pointer"
              >
                <div className="text-sm">
                  {currentSong?.id === song.id && isPlaying ? (
                    <div className="w-3 h-3 bg-spotify-green rounded-full animate-pulse" />
                  ) : (
                    <span className={cn(
                      "group-hover:hidden text-zinc-500",
                      currentSong?.id === song.id && "text-spotify-green"
                    )}>{index + 1}</span>
                  )}
                  <Play size={14} fill="currentColor" className="hidden group-hover:block text-white" onClick={() => playSong(song, songs)} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    currentSong?.id === song.id ? "text-spotify-green" : "text-white"
                  )}>{song.title}</span>
                </div>
                <span className="text-sm text-zinc-400 truncate">{song.artist}</span>
                <span className="text-sm text-zinc-500 flex justify-center">--:--</span>
              </div>
            ))}

            {songs.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <Music2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>No songs in this playlist.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
