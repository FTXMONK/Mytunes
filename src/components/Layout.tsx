import React from 'react';
import { Sidebar } from './Sidebar';
import { PlayerBar } from './PlayerBar';
import { useAuth } from '../context/AuthContext';
import { Music2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { signInWithGoogle, loginWithEmail, signUpWithEmail } from '../lib/firebase';

export function Layout({ 
  children, 
  activeView, 
  setActiveView,
  onSelectPlaylist,
  selectedPlaylistId
}: { 
  children: React.ReactNode, 
  activeView: 'home' | 'users' | 'playlist' | 'admin-songs', 
  setActiveView: (view: 'home' | 'users' | 'playlist' | 'admin-songs') => void,
  onSelectPlaylist: (id: string) => void,
  selectedPlaylistId?: string | null
}) {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

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
        
        <div className="z-10 flex flex-col items-center text-center w-full max-w-sm">
          <img src="https://i.postimg.cc/sX9SSZMf/IMG-2302.png" alt="TunesByMe Logo" className="w-20 h-20 object-contain mb-4 drop-shadow-[0_0_20px_rgba(29,185,84,0.3)]" />
          <h1 className="mb-2 text-4xl font-black tracking-tight">TunesByMe</h1>
          <p className="mb-8 text-zinc-400 text-sm">Experience your music like never before.</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-full bg-white text-black px-8 py-3 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl mb-6"
          >
            Continue with Google
          </button>

          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">or</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="w-full space-y-3">
            {authMode === 'signup' && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Your Name"
                  required
                  className="w-full bg-[#181818] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm focus:border-spotify-green outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                className="w-full bg-[#181818] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm focus:border-spotify-green outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                required
                className="w-full bg-[#181818] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm focus:border-spotify-green outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              {authMode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-zinc-400 text-xs">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-white font-bold hover:underline"
              type="button"
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
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
