import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, deleteDoc, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Playlist, Song } from '../types';
import { Play, Clock, Upload, X, Edit2, Trash2, Camera, Music2, Plus, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [file, setFile] = useState<File | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSongs((items: Song[]) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const newOrderedSongs = arrayMove(items, oldIndex, newIndex);
        
        // Update Firestore
        if (playlist) {
          updateDoc(doc(db, 'playlists', playlist.id), {
            songIds: newOrderedSongs.map((s: Song) => s.id)
          }).catch(console.error);
        }

        return newOrderedSongs;
      });
    }
  };

  useEffect(() => {
    // Fetch latest 50 songs for recommendations, excluding those already in playlist
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
    });
    return unsubscribe;
  }, []);

  const addToPlaylist = async (songId: string) => {
    if (!playlist) return;
    if (playlist.songIds.includes(songId)) return;
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), {
        songIds: [...playlist.songIds, songId]
      });
    } catch (err) {
      console.error('Failed to add song to playlist:', err);
      alert('Failed to add song. Check console for details.');
    }
  };

  const handleUploadToPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !playlist) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `songs/${user.uid}/${Date.now()}_${sanitizedName}`);
      
      console.log("Starting direct upload (uploadBytes) from playlist view to:", storageRef.fullPath);
      const uploadResult = await uploadBytes(storageRef, file);
      console.log("Upload successful, getting download URL...");
      
      const url = await getDownloadURL(uploadResult.ref);
      console.log("URL obtained, saving to Firestore...");
      
      const songDoc = await addDoc(collection(db, 'songs'), {
        title: newSong.title || file.name,
        artist: newSong.artist || 'Unknown Artist',
        audioUrl: url,
        uploaderId: user.uid,
        uploaderEmail: user.email || 'unknown',
        createdAt: serverTimestamp()
      });

      console.log("Song saved to DB. ID:", songDoc.id);
      // Add to current playlist
      await updateDoc(doc(db, 'playlists', playlist.id), {
        songIds: [...playlist.songIds, songDoc.id]
      });
      console.log("Added to playlist.");

      setShowUploadModal(false);
      setFile(null);
      setNewSong({ title: '', artist: '' });
      setUploading(false);
    } catch (err: any) {
      console.error("Upload failed in playlist view:", err);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
      setUploading(false);
    }
  };

  const handleRename = async () => {
    if (!playlist || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), { name: newName });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'playlists', playlist.id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const removeFromPlaylist = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playlist) return;
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), {
        songIds: playlist.songIds.filter(id => id !== songId)
      });
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
              <button 
                onClick={() => setShowUploadModal(true)}
                className="ml-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                <Plus size={14} />
                Upload Song
              </button>
              <button 
                onClick={handleDeletePlaylist}
                className="ml-2 text-zinc-500 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-full"
                title="Delete Playlist"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-4 px-4 py-2 text-zinc-400 text-[10px] font-bold border-b border-white/10 uppercase tracking-widest mb-4">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <div className="flex justify-center"><Clock size={14} /></div>
          </div>

          <div className="space-y-1">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={songs.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {songs.map((song, index) => (
                  <SortableSongRow 
                    key={song.id}
                    song={song}
                    index={index}
                    songs={songs}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    playSong={playSong}
                    removeFromPlaylist={removeFromPlaylist}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {songs.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <Music2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>No songs in this playlist.</p>
              </div>
            )}
          </div>

          {/* Add Songs Section */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">Let's find something for your playlist</h2>
            <div className="relative mb-8">
              <input 
                type="text" 
                placeholder="Search for songs"
                className="w-full max-w-md bg-white/10 rounded-full px-6 py-3 text-sm outline-none focus:bg-white/20 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              {allSongs
                .filter(s => !playlist.songIds.includes(s.id))
                .filter(s => 
                  s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.artist.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 10)
                .map(song => (
                  <div key={song.id} className="grid grid-cols-[1fr_40px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 transition-all group items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-zinc-600">
                        <Music2 size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{song.title}</span>
                        <span className="text-xs text-zinc-400">{song.artist}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToPlaylist(song.id)}
                      className="px-4 py-1 border border-zinc-500 rounded-full text-xs font-bold hover:border-white transition-all whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadToPlaylist}
        uploading={uploading}
        progress={uploadProgress}
        newSong={newSong}
        setNewSong={setNewSong}
        file={file}
        setFile={setFile}
      />
    </div>
  );
}

interface SortableSongRowProps {
  song: Song;
  index: number;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song, playlist: Song[]) => void;
  removeFromPlaylist: (songId: string, e: React.MouseEvent) => void | Promise<void>;
}

const SortableSongRow: React.FC<SortableSongRowProps> = ({ 
  song, 
  index, 
  songs, 
  currentSong, 
  isPlaying, 
  playSong, 
  removeFromPlaylist 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onDoubleClick={() => playSong(song, songs)}
      className={cn(
        "grid grid-cols-[32px_1fr_1fr_40px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 transition-all group items-center cursor-pointer relative",
        isDragging && "bg-white/10 shadow-xl"
      )}
    >
      <div className="flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500"
        >
          <GripVertical size={14} />
        </div>
        <div className="text-sm w-4">
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
      </div>
      <div className="flex flex-col min-w-0">
        <span className={cn(
          "text-sm font-medium truncate",
          currentSong?.id === song.id ? "text-spotify-green" : "text-white"
        )}>{song.title}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400 truncate">{song.artist}</span>
        <button 
          onClick={(e) => removeFromPlaylist(song.id, e)}
          className="hidden group-hover:flex text-zinc-500 hover:text-red-500 transition-colors p-1"
          title="Remove from playlist"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <span className="text-sm text-zinc-500 flex justify-center">--:--</span>
    </div>
  );
}

function UploadModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  uploading, 
  progress, 
  newSong, 
  setNewSong, 
  file, 
  setFile 
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#181818] w-full max-w-md rounded-2xl p-8 border border-white/5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-8">Upload to Playlist</h2>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Song Title</label>
            <input 
              type="text"
              required
              placeholder="Song title"
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
              placeholder="Artist name"
              className="w-full bg-[#2a2a2a] border-none rounded-lg p-4 text-sm focus:ring-1 focus:ring-spotify-green outline-none transition-all"
              value={newSong.artist}
              onChange={e => setNewSong({...newSong, artist: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audio File</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/5 border-dashed rounded-xl cursor-pointer bg-[#2a2a2a]/30 hover:bg-[#2a2a2a] hover:border-spotify-green/50 transition-all group">
              <div className="flex flex-col items-center justify-center p-4">
                <Upload size={24} className="mb-2 text-zinc-400 group-hover:text-spotify-green" />
                <p className="text-xs text-center text-zinc-400">
                  {file ? <span className="text-white font-medium">{file.name}</span> : "Select .mp3 file"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="audio/*" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </label>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-spotify-green transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add to Playlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
