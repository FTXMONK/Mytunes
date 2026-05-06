export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  uploaderId: string;
  uploaderEmail: string;
  createdAt: any;
}

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  songIds: string[];
  coverUrl?: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export type RepeatMode = 'none' | 'one' | 'all';
