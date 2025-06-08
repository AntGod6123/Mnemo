import React, { useEffect, useState } from 'react';

export default function PluginManager() {
  const [zimDir, setZimDir] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/admin/config')
      .then(res => res.json())
      .then(data => setZimDir(data.zim_dir || ''));
  }, []);

  const saveConfig = async () => {
    const res = await fetch('/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ zim_dir: zimDir })
    });
    const result = await res.json();
    setMessage(result.message || 'Saved');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Plugin Manager</h2>
      <div className="mb-4">
        <label className="block mb-1">ZIM Directory Path</label>
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={zimDir}
          onChange={e => setZimDir(e.target.value)}
        />
      </div>
      <button
        onClick={saveConfig}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save & Reload
      </button>
      {message && <div className="mt-2 text-green-600">{message}</div>}
    </div>
  );
}
