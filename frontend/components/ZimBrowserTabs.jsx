import React, { useState } from 'react';

export default function ZimBrowserTabs() {
  const [tabs, setTabs] = useState([]);
  const [active, setActive] = useState(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const [models, setModels] = useState([]);
  const [toLang, setToLang] = useState('');
  const [targetTab, setTargetTab] = useState(null);

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

  const openTranslateModal = async (tab) => {
    const res = await fetch('/translate/models');
    const mods = await res.json();
    setModels(mods);
    setToLang('');
    setTargetTab(tab);
    setShowTranslate(true);
  };

  const runTranslate = async () => {
    if (!targetTab || !toLang) return;
    const res = await fetch('/translate/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zim_id: targetTab.zimId, path: targetTab.path, to_lang: toLang })
    });
    const data = await res.json();
    if (data.translated) {
      setTabs(tabs.map(t => t.id === targetTab.id ? { ...t, translated: data.translated } : t));
    }
    setShowTranslate(false);
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
            <button onClick={() => openTranslateModal(tab)} className="ml-2 text-blue-500">🌐</button>
            <button onClick={() => closeTab(tab.id)} className="ml-2 text-red-500">×</button>
          </div>
        ))}
      </div>
      {tabs.map(tab => (
        <div key={tab.id} className={tab.id === active ? "p-4" : "hidden"}>
          <iframe
            title={tab.title}
            src={tab.translated ? undefined : `/article/${tab.zimId}/${tab.path}`}
            srcDoc={tab.translated ? `<html><body>${tab.translated}</body></html>` : undefined}
            className="w-full h-[80vh] border"
          />
        </div>
      ))}

      {showTranslate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-80">
            <h3 className="text-lg font-bold mb-2">Translate Page</h3>
            <select value={toLang} onChange={e => setToLang(e.target.value)} className="w-full p-2 border rounded mb-4">
              <option value="">Select language</option>
              {models.map(m => (
                <option key={m.to_code + m.from_code} value={m.to_code}>{m.to_name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTranslate(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={runTranslate} disabled={!toLang} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                Translate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
