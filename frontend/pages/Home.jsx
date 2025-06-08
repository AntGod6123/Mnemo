import React, { useEffect, useState } from 'react';
import SearchPanel from '../components/SearchPanel';
import UserMenu from '../components/UserMenu';
import { BookOpenIcon } from 'lucide-react';

export default function Home({ onOpenTab }) {
  const [zimFiles, setZimFiles] = useState([]);

  useEffect(() => {
    fetch('/zim/list')
      .then(res => res.json())
      .then(data => setZimFiles(data.zims || []));
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Offline Browser</h1>
        <UserMenu />
      </div>
      <SearchPanel onOpenTab={onOpenTab} />

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
              <div className="flex items-center gap-2 mb-2">
                <BookOpenIcon size={20} />
                <span className="font-medium truncate">{zim.title || zim.file}</span>
              </div>
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
