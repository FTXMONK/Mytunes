import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Users, Mail, ShieldCheck } from 'lucide-react';

export function AdminUsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2">User Management</h1>
        <p className="text-zinc-400">Manage and view all registered users of Mytunes.</p>
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold uppercase">{user.displayName?.[0] || user.email?.[0]}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm group-hover:text-zinc-200">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {user.isAdmin ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-spotify-green/10 text-spotify-green rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Member
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No users found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
