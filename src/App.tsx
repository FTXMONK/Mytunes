/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Layout } from './components/Layout';
import { HomeView } from './components/HomeView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminSongsView } from './components/AdminSongsView';
import { PlaylistView } from './components/PlaylistView';

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'users' | 'admin-songs' | 'playlist'>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const onSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setActiveView('playlist');
  };

  return (
    <AuthProvider>
      <PlayerProvider>
        <Layout 
          activeView={activeView === 'playlist' ? 'home' : (activeView === 'admin-songs' ? 'users' : activeView)} 
          setActiveView={setActiveView}
          onSelectPlaylist={onSelectPlaylist}
          selectedPlaylistId={selectedPlaylistId}
        >
          {activeView === 'home' && <HomeView />}
          {activeView === 'users' && <AdminUsersView />}
          {activeView === 'admin-songs' && <AdminSongsView />}
          {activeView === 'playlist' && selectedPlaylistId && (
            <PlaylistView playlistId={selectedPlaylistId} />
          )}
        </Layout>
      </PlayerProvider>
    </AuthProvider>
  );
}
