'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  if (status === 'loading') {
    return (
      <header className="bg-white/95 border-b border-zinc-200/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">S</span>
              </div>
              <h1 className="text-xl font-extralight text-zinc-900 tracking-wide">SOBapp</h1>
            </div>
            <div className="animate-pulse w-8 h-8 bg-zinc-100 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/95 border-b border-zinc-200/50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <h1 className="text-xl font-extralight text-zinc-900 tracking-wide">SOBapp</h1>
          </div>

          {session?.user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-600">
                <span className="font-medium text-zinc-900">{session.user.name}</span>
                {session.user.company && (
                  <span className="ml-2 text-zinc-500">• {session.user.company}</span>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {session.user.name?.charAt(0).toUpperCase()}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 rounded-md shadow-lg py-1 z-10 border border-zinc-200/50">
                    <div className="px-4 py-2 border-b border-zinc-200/50">
                      <p className="text-sm font-medium text-zinc-900">{session.user.name}</p>
                      <p className="text-xs text-zinc-600">{session.user.email}</p>
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        {session.user.subscription.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
