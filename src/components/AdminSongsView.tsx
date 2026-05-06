import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { Music, Play, Trash2, Mail, Clock, User } from 'lucide-react';
import { formatTime, cn } from '../lib/utils';

export function AdminSongsView() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSong, currentSong, isPlaying } = usePlayer();

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching songs for admin:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this song? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'songs', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2">Global Song Repository</h1>
        <p className="text-zinc-400">View and manage every track uploaded to TunesByMe.</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-spotify-green border-t-transparent" />
        </div>
      ) : (
        <div className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Track Details</th>
                <th className="px-6 py-4">Uploader</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, index) => (
                <tr key={song.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-zinc-500 text-sm">
                    {currentSong?.id === song.id && isPlaying ? (
                       <div className="w-3 h-3 bg-spotify-green rounded-full animate-pulse" />
                    ) : index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 group-hover:text-spotify-green transition-colors">
                        <Music size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          currentSong?.id === song.id ? "text-spotify-green" : "text-white"
                        )}>{song.title}</span>
                        <span className="text-xs text-zinc-500">{song.artist}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <User size={12} className="text-zinc-500" />
                        <span className="truncate">{song.uploaderEmail?.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Mail size={12} />
                        <span className="truncate">{song.uploaderEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => playSong(song, songs)}
                        className="p-2 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
                      >
                        {currentSong?.id === song.id && isPlaying ? <Play size={14} fill="black" /> : <Play size={14} fill="black" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {songs.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              <Music size={48} className="mx-auto mb-4 opacity-20" />
              <p>No songs found on the platform.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
