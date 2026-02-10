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
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MIAR</h1>
            </div>
            <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">MIAR</h1>
          </div>

          {session?.user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{session.user.name}</span>
                {session.user.company && (
                  <span className="ml-2 text-gray-500">• {session.user.company}</span>
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        {session.user.subscription.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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