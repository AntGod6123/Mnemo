import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function PluginManager() {
  const [zimDir, setZimDir] = useState('');
  const [iconDir, setIconDir] = useState('');
  const [origZimDir, setOrigZimDir] = useState('');
  const [origIconDir, setOrigIconDir] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [origSessionTimeout, setOrigSessionTimeout] = useState(30);
  const [zims, setZims] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmUrl, setLlmUrl] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [ldapUrl, setLdapUrl] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState('');
  const [argosProgress, setArgosProgress] = useState(null);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => res.json())
      .then(data => {
        setZimDir(data.zim_dir || '');
        setOrigZimDir(data.zim_dir || '');
        setIconDir(data.icon_dir || '');
        setOrigIconDir(data.icon_dir || '');
        setSessionTimeout(data.session_timeout || 30);
        setOrigSessionTimeout(data.session_timeout || 30);
        setLlmEnabled(data.llm_enabled || false);
        setLlmUrl(data.llm_url || '');
        setLlmKey(data.llm_api_key || '');
        setLdapUrl(data.ldap_url || '');
        setSsoUrl(data.sso_url || '');
        setOverrides(data.zim_overrides || {});
      });
    fetch('/zim/list')
      .then(r => r.json())
      .then(d => setZims(d.zims || []));
  }, []);

  const saveConfig = async () => {
    const move = (zimDir !== origZimDir) || (iconDir !== origIconDir);

    const body = {
      zim_dir: zimDir,
      icon_dir: iconDir,
      llm_enabled: llmEnabled,
      llm_url: llmUrl,
      llm_api_key: llmKey,
      ldap_url: ldapUrl,
      sso_url: ssoUrl,
      session_timeout: Number(sessionTimeout),
      zim_overrides: overrides,
      move_existing: false,
      create_dirs: false
    };

    if (move) {
      const confirmMove = window.confirm('Move existing files to new directories?');
      body.move_existing = confirmMove;
    }

    const doSave = async () => {
      const res = await apiFetch('/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (res.status === 400) {
        const err = await res.json();
        const ok = window.confirm(`${err.detail}. Create directory?`);
        if (ok) {
          body.create_dirs = true;
          return doSave();
        } else {
          throw new Error(err.detail);
        }
      }
      return res.json();
    };

    try {
      const result = await doSave();
      setMessage(result.message || 'Saved');
      setOrigZimDir(zimDir);
      setOrigIconDir(iconDir);
      setOrigSessionTimeout(sessionTimeout);
      fetch('/zim/list').then(r => r.json()).then(d => {
        setZims(d.zims || []);
        window.dispatchEvent(new Event('zim-updated'));
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateArgos = async () => {
    setArgosProgress(0);
    const res = await apiFetch('/admin/update-argos', {
      method: 'POST',
      credentials: 'include'
    });
    await res.json();
    const interval = setInterval(async () => {
      const r = await apiFetch('/admin/argos-progress');
      const d = await r.json();
      setArgosProgress(d.progress);
      if (d.progress >= 100) {
        clearInterval(interval);
        setMessage('Installation complete');
      }
    }, 1000);
  };

  const loadLogs = async () => {
    const res = await apiFetch('/admin/logs', { credentials: 'include' });
    const data = await res.json();
    setLogs(data.logs || '');
  };

  const addUser = async () => {
    if (!newUserName || !newUserPass) {
      setMessage('Username and password required');
      return;
    }
    const res = await apiFetch('/admin/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: newUserName, password: newUserPass })
    });
    const data = await res.json();
    setMessage(data.message || 'User added');
    setNewUserName('');
    setNewUserPass('');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Server Settings</h2>
      <div className="mb-4">
        <label className="block mb-1">ZIM Directory Path</label>
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={zimDir}
          onChange={e => setZimDir(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Icon Directory</label>
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={iconDir}
          onChange={e => setIconDir(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Collection Overrides</h3>
        {zims.map(z => (
          <div key={z.file} className="flex flex-wrap items-center gap-2 mb-2">
            <span className="w-40 break-all">{z.file}</span>
            <input
              className="flex-1 p-1 border rounded dark:bg-gray-800 dark:text-white"
              placeholder="Display name"
              value={overrides[z.file]?.title || ''}
              onChange={e => setOverrides(o => ({ ...o, [z.file]: { ...(o[z.file] || {}), title: e.target.value } }))}
            />
            <input
              className="flex-1 p-1 border rounded dark:bg-gray-800 dark:text-white"
              placeholder="Icon filename"
              value={overrides[z.file]?.image || ''}
              onChange={e => setOverrides(o => ({ ...o, [z.file]: { ...(o[z.file] || {}), image: e.target.value } }))}
            />
            <input
              type="file"
              id={`icon-${z.file}`}
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                apiFetch('/admin/upload-icon', { method: 'POST', credentials: 'include', body: form })
                  .then(r => r.json())
                  .then(d => {
                    setMessage(d.message);
                    setOverrides(o => ({ ...o, [z.file]: { ...(o[z.file] || {}), image: d.filename } }));
                  });
              }}
            />
            <button onClick={() => document.getElementById(`icon-${z.file}`).click()} className="px-2 py-1 text-sm bg-gray-200 rounded">
              Upload Icon
            </button>
          </div>
        ))}
        <input type="file" id="zim-upload" accept=".zim" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.append('file', file);
          apiFetch('/admin/upload-zim', { method: 'POST', credentials: 'include', body: form })
            .then(r => r.json())
            .then(d => {
              setMessage(d.message);
              fetch('/zim/list').then(r => r.json()).then(v => {
                setZims(v.zims || []);
                window.dispatchEvent(new Event('zim-updated'));
              });
            });
        }} />
        <button onClick={() => document.getElementById('zim-upload').click()} className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">
          Add ZIM File
        </button>
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
      <div className="mb-4">
        <label className="block mb-1">Session Timeout (minutes)</label>
        <select
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={sessionTimeout}
          onChange={e => setSessionTimeout(Number(e.target.value))}
        >
          {[5,10,20,30,60].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 space-y-2">
        <h3 className="font-semibold">User Management</h3>
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Username"
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
          />
          <input
            type="password"
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Password"
            value={newUserPass}
            onChange={e => setNewUserPass(e.target.value)}
          />
          <button
            onClick={addUser}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Add User
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-1">LDAP Server URL</label>
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={ldapUrl}
          onChange={e => setLdapUrl(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">SSO Provider URL</label>
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={ssoUrl}
          onChange={e => setSsoUrl(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={saveConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save & Reload
        </button>
        <button
          onClick={updateArgos}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Install Translation
        </button>
        {argosProgress !== null && (
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded"
              style={{ width: `${argosProgress}%` }}
            ></div>
          </div>
        )}
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Refresh Logs
        </button>
      </div>
      {logs && (
        <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-900 text-xs overflow-auto h-60 whitespace-pre-wrap">
          {logs}
        </pre>
      )}
      {message && <div className="mt-2 text-green-600">{message}</div>}
    </div>
  );
}
