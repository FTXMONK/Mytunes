import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Song, Playlist } from '../types';
import { Play, Plus, Clock, Upload, X, Music2, Edit2, Check, Trash2 } from 'lucide-react';
import { formatTime, cn } from '../lib/utils';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';

export function HomeView() {
  const { user, isAdmin } = useAuth();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [file, setFile] = useState<File | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '' });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'playlists'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist)));
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    }, (error) => {
      console.error("Rules likely restricted list:", error);
    });
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `songs/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'songs'), {
        title: newSong.title || file.name,
        artist: newSong.artist || 'Unknown Artist',
        audioUrl: url,
        uploaderId: user.uid,
        uploaderEmail: user.email,
        createdAt: serverTimestamp()
      });

      setShowUpload(false);
      setFile(null);
      setNewSong({ title: '', artist: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (song: Song) => {
    setEditingSongId(song.id);
    setEditForm({ title: song.title, artist: song.artist });
  };

  const saveEdit = async (songId: string) => {
    try {
      await updateDoc(doc(db, 'songs', songId), {
        title: editForm.title,
        artist: editForm.artist
      });
      setEditingSongId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSong = async (id: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteDoc(doc(db, 'songs', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addToPlaylist = async (playlistId: string, songId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    if (playlist.songIds.includes(songId)) {
      alert('Song already in playlist');
      setShowPlaylistMenu(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        songIds: [...playlist.songIds, songId]
      });
      setShowPlaylistMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1 relative h-full">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-spotify-green/10 to-transparent pointer-events-none" />

      {/* Persistent Header */}
      <header className="h-16 flex items-center justify-between px-8 z-10 sticky top-0 transition-all">
        <div className="flex gap-4">
          <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <button 
           onClick={() => setShowUpload(true)}
           className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          Upload New Song
        </button>
      </header>

      <div className="px-8 py-4 flex-1 z-10 flex flex-col scrollbar-hide overflow-y-auto">
        <div className="flex items-end gap-6 mb-12">
          <div className="w-52 h-52 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-spotify-green to-emerald-900 flex items-center justify-center">
              <Play size={80} fill="white" className="opacity-20" />
            </div>
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#b3b3b3]">Playlist</span>
            <h1 className="text-7xl font-black mb-2 tracking-tighter">Your Groove</h1>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="text-white">{user?.displayName || 'User'}</span> • {songs.length} songs
            </div>
          </div>
        </div>

        {/* Tracks List */}
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
                      "group-hover:hidden",
                      currentSong?.id === song.id ? "text-spotify-green" : "text-zinc-500"
                    )}>{index + 1}</span>
                  )}
                  <Play 
                    size={14} 
                    fill="currentColor" 
                    className="hidden group-hover:block text-white" 
                    onClick={() => playSong(song, songs)} 
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  {editingSongId === song.id ? (
                    <input 
                      autoFocus
                      className="bg-zinc-800 text-sm font-medium py-0.5 px-2 rounded outline-none border border-spotify-green/50"
                      value={editForm.title}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                    />
                  ) : (
                    <span className={cn(
                      "text-sm font-medium truncate",
                      currentSong?.id === song.id ? "text-spotify-green" : "text-white"
                    )}>{song.title}</span>
                  )}
                  {isAdmin && <span className="text-[9px] text-[#b3b3b3]/40 truncate">{song.uploaderEmail}</span>}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {editingSongId === song.id ? (
                    <input 
                      className="bg-zinc-800 text-sm text-zinc-300 py-0.5 px-2 rounded outline-none border border-white/10 w-full"
                      value={editForm.artist}
                      onChange={e => setEditForm({...editForm, artist: e.target.value})}
                    />
                  ) : (
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-200 truncate">{song.artist}</span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {(song.uploaderId === user?.uid || isAdmin) && (
                    <div className="hidden group-hover:flex items-center gap-2 mr-2">
                      {editingSongId === song.id ? (
                        <button onClick={() => saveEdit(song.id)} className="text-spotify-green p-1 hover:bg-white/10 rounded">
                          <Check size={14} />
                        </button>
                      ) : (
                        <button onClick={() => startEditing(song)} className="text-zinc-500 hover:text-white p-1 hover:bg-white/10 rounded">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {(song.uploaderId === user?.uid || isAdmin) && (
                        <button onClick={() => deleteSong(song.id)} className="text-zinc-500 hover:text-red-500 p-1 hover:bg-white/10 rounded">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="relative group/menu">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylistMenu(showPlaylistMenu === song.id ? null : song.id);
                      }}
                      className="text-zinc-500 hover:text-white p-1 hover:bg-white/10 rounded"
                    >
                      <Plus size={16} />
                    </button>
                    {showPlaylistMenu === song.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#282828] border border-white/10 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Add to playlist
                        </div>
                        <div className="max-h-40 overflow-y-auto pt-1">
                          {playlists.map(p => (
                            <button
                              key={p.id}
                              onClick={() => addToPlaylist(p.id, song.id)}
                              className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white truncate"
                            >
                              {p.name}
                            </button>
                          ))}
                          {playlists.length === 0 && (
                            <div className="px-3 py-2 text-[10px] text-zinc-600 italic">No playlists</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-sm text-zinc-500 group-hover:text-white">--:--</span>
                </div>
              </div>
            ))}

            {songs.length === 0 && (
              <div className="text-center py-32 text-zinc-500">
                <Music2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Your library is quiet</p>
                <p className="text-sm mt-1">Upload some music to fill the silence.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] w-full max-w-md rounded-2xl p-8 border border-white/5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowUpload(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-8">Upload Track</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Song Title</label>
                <input 
                  type="text"
                  required
                  placeholder="The name of your masterpiece"
                  className="w-full bg-[#2a2a2a] border-none rounded-lg p-4 text-sm focus:ring-1 focus:ring-spotify-green outline-none transition-all"
                  value={newSong.title}
                  onChange={e => setNewSong({...newSong, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Artist</label>
                <input 
                  type="text"
                  required
                  placeholder="Who's the star?"
                  className="w-full bg-[#2a2a2a] border-none rounded-lg p-4 text-sm focus:ring-1 focus:ring-spotify-green outline-none transition-all"
                  value={newSong.artist}
                  onChange={e => setNewSong({...newSong, artist: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audio File</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-white/5 border-dashed rounded-xl cursor-pointer bg-[#2a2a2a]/30 hover:bg-[#2a2a2a] hover:border-spotify-green/50 transition-all group">
                  <div className="flex flex-col items-center justify-center p-4">
                    <Upload size={32} className="mb-3 text-zinc-400 group-hover:text-spotify-green" />
                    <p className="text-sm text-center text-zinc-400 group-hover:text-zinc-200">
                      {file ? <span className="text-white font-medium">{file.name}</span> : "Drop your track (.mp3, .wav) here"}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".mp3,audio/mpeg,audio/wav,audio/x-wav,audio/*" 
                    onChange={e => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        console.log("Selected file type:", selectedFile.type);
                        setFile(selectedFile);
                      }
                    }} 
                  />
                </label>
              </div>
              <button 
                type="submit"
                disabled={uploading || !file}
                className="w-full bg-spotify-green text-black font-bold py-4 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 shadow-xl"
              >
                {uploading ? "Broadcasting..." : "Publish Song"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
