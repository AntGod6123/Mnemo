import React, { useEffect, useState } from 'react';
import SearchPanel from '../components/SearchPanel';
import Header from '../components/Header';
import { apiFetch } from '../api';
import logo from '../../logo.png';

export default function Home({ onSearch }) {
  const [zimFiles, setZimFiles] = useState([]);

  const loadZims = () => {
    apiFetch('/zim/list')
      .then(res => res.json())
      .then(data => setZimFiles(data.zims || []));
  };

  useEffect(() => {
    loadZims();
    const handler = () => loadZims();
    window.addEventListener('zim-updated', handler);
    return () => window.removeEventListener('zim-updated', handler);
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Header onHome={() => {}} />
      <SearchPanel onSearch={onSearch} />

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Browse by Collection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {zimFiles.map((zim, i) => (
            <a
              key={i}
              href={`#/zim/${zim.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-left shadow-sm"
            >
              {zim.image ? (
                <img src={zim.image} alt="" className="w-full h-24 object-contain mb-2" />
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <img src={logo} alt="logo" className="w-6 h-6" />
                  <span className="font-medium truncate">{zim.title || zim.file}</span>
                </div>
              )}
              {zim.image && (
                <div className="font-medium truncate mb-2 text-center">{zim.title || zim.file}</div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {zim.lang.toUpperCase()} • {zim.count.toLocaleString()} articles
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
