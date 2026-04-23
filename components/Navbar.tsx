'use client';
import { signOut } from 'next-auth/react';

export default function Navbar({ userName }: { userName: string }) {
  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="container mx-auto max-w-3xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">✓</span>
          <span className="font-semibold text-gray-800">TaskManager</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userName}</span>
          <button
            data-testid="logout-btn"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
