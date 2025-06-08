import React, { useState } from 'react';

export default function ZimBrowserTabs() {
  const [tabs, setTabs] = useState([]);
  const [active, setActive] = useState(null);

  const openTab = (zimId, path, title) => {
    const id = `${zimId}:${path}`;
    if (!tabs.find(t => t.id === id)) {
      setTabs([...tabs, { id, zimId, path, title }]);
    }
    setActive(id);
  };

  const closeTab = (id) => {
    setTabs(tabs.filter(t => t.id !== id));
    if (active === id && tabs.length > 1) {
      const next = tabs.find(t => t.id !== id);
      setActive(next.id);
    } else if (tabs.length === 1) {
      setActive(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`px-4 py-2 cursor-pointer ${tab.id === active ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-800'}`}
            onClick={() => setActive(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              window.open(`/article/${tab.zimId}/${tab.path}`, '_blank');
            }}
          >
            {tab.title}
            <button onClick={() => closeTab(tab.id)} className="ml-2 text-red-500">×</button>
          </div>
        ))}
      </div>
      {tabs.map(tab => (
        <div key={tab.id} className={tab.id === active ? "p-4" : "hidden"}>
          <iframe
            title={tab.title}
            src={`/article/${tab.zimId}/${tab.path}`}
            className="w-full h-[80vh] border"
          />
        </div>
      ))}
    </div>
  );
}
