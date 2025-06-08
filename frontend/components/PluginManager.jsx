import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function PluginManager() {
  const [zimDir, setZimDir] = useState('');
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmUrl, setLlmUrl] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [message, setMessage] = useState('');
  const [overridesText, setOverridesText] = useState('');
  const [logs, setLogs] = useState('');

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => res.json())
      .then(data => {
        setZimDir(data.zim_dir || '');
        setLlmEnabled(data.llm_enabled || false);
        setLlmUrl(data.llm_url || '');
        setLlmKey(data.llm_api_key || '');
        setOverridesText(JSON.stringify(data.zim_overrides || {}, null, 2));
      });
  }, []);

  const saveConfig = async () => {
    const res = await apiFetch('/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        zim_dir: zimDir,
        llm_enabled: llmEnabled,
        llm_url: llmUrl,
        llm_api_key: llmKey,
        zim_overrides: JSON.parse(overridesText || '{}')
      })
    });
    const result = await res.json();
    setMessage(result.message || 'Saved');
  };

  const updateArgos = async () => {
    const res = await apiFetch('/admin/update-argos', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    setMessage(data.message || 'Update complete');
  };

  const loadLogs = async () => {
    const res = await apiFetch('/admin/logs', { credentials: 'include' });
    const data = await res.json();
    setLogs(data.logs || '');
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
      <div className="mb-4">
        <label className="block mb-1">Collection Overrides (JSON)</label>
        <textarea
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white h-32"
          value={overridesText}
          onChange={e => setOverridesText(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={llmEnabled} onChange={e => setLlmEnabled(e.target.checked)} />
          Enable LLM
        </label>
      </div>
      {llmEnabled && (
        <div className="mb-4 space-y-4">
          <div>
            <label className="block mb-1">LLM URL</label>
            <input
              className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
              value={llmUrl}
              onChange={e => setLlmUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">API Key</label>
            <input
              className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
              value={llmKey}
              onChange={e => setLlmKey(e.target.value)}
            />
          </div>
        </div>
      )}
      <button
        onClick={saveConfig}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save & Reload
      </button>
      <button
        onClick={updateArgos}
        className="ml-2 px-4 py-2 bg-green-600 text-white rounded"
      >
        Update Argos Models
      </button>
      <button
        onClick={loadLogs}
        className="ml-2 px-4 py-2 bg-gray-600 text-white rounded"
      >
        Refresh Logs
      </button>
      {logs && (
        <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 text-xs overflow-auto h-60 whitespace-pre-wrap">
          {logs}
        </pre>
      )}
      {message && <div className="mt-2 text-green-600">{message}</div>}
    </div>
  );
}
