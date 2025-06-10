import React from 'react';
import DarkModeToggle from './DarkModeToggle';
import UserMenu from './UserMenu';

export default function Header({ onHome }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <button onClick={onHome} className="text-xl font-bold flex items-center gap-2">
        <span>🏠</span>
        <span className="hidden sm:inline">Home</span>
      </button>
      <div className="flex items-center gap-4">
        <DarkModeToggle />
        <UserMenu />
      </div>
    </div>
  );
}
