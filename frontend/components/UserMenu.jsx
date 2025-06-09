import React, { useEffect, useState } from 'react';
import { apiFetch, API_BASE } from '../api';
import { UserCircle, Eye, EyeOff } from 'lucide-react';
import PluginManager from './PluginManager';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const exportPdf = () => {
    const tab = window.activeZimTab;
    if (tab) {
      window.open(`${API_BASE}/article/${tab.zimId}/${tab.path}/pdf`, '_blank');
      setOpen(false);
    } else {
      alert('No page selected');
    }
  };

  const fetchStatus = async () => {
    const res = await apiFetch('/auth/status', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setLoggedIn(data.logged_in);
      setUsername(data.username || '');
    } else {
      setLoggedIn(false);
      setUsername('');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: loginUser, password: loginPass })
    });
    if (res.ok) {
      const data = await res.json();
      setLoggedIn(true);
      setUsername(data.username);
      setLoginUser('');
      setLoginPass('');
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setLoggedIn(false);
    setUsername('');
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpen(!open)} className="p-2">
        <UserCircle size={24} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {loggedIn ? (
            <div className="py-1">
              <div className="px-4 py-2 text-sm">Logged in as {username}</div>
              <button
                onClick={() => setShowSettings(true)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Server Settings
              </button>
              <button
                onClick={logout}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Logout
              </button>
              <button
                onClick={exportPdf}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export PDF
              </button>
              <button
                onClick={() => setShowAbout(true)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                About
              </button>
            </div>
          ) : (
            <form onSubmit={login} className="p-4 space-y-2">
              <input
                className="w-full p-1 border rounded dark:bg-gray-700"
                placeholder="Username"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full p-1 border rounded dark:bg-gray-700 pr-8"
                  placeholder="Password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center px-2"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white rounded px-2 py-1">
                Login
              </button>
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className="w-full mt-2 text-left text-sm hover:underline"
              >
                About
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="w-full mt-2 text-left text-sm hover:underline"
              >
                Export PDF
              </button>
            </form>
          )}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-96 max-h-[90vh] overflow-auto">
            <PluginManager />
            <button
              onClick={() => setShowSettings(false)}
              className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-80">
            <h2 className="text-lg font-bold mb-2">About</h2>
            <p className="mb-4">Mnemo is an offline ZIM browser with optional AI-powered search.</p>
            <button
              onClick={() => setShowAbout(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
