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

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please add this URL to your Firebase Console > Auth > Settings > Authorized Domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Google Login failed');
      }
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
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 rounded-full bg-black border border-white/20 text-white px-8 py-3 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
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
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-500 text-[11px] leading-relaxed text-center font-medium">
                  {error}
                </p>
                {error.includes('auth/unauthorized-domain') && (
                  <p className="text-zinc-500 text-[10px] mt-2 text-center">
                    Project ID: gen-lang-client-0178848928
                  </p>
                )}
              </div>
            )}
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
