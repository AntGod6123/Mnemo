import React, { useRef } from 'react';
import Home from './pages/Home.jsx';
import ZimBrowserTabs from './components/ZimBrowserTabs.jsx';

export default function App() {
  const tabsRef = useRef(null);

  const openTab = (zimId, path, title) => {
    if (tabsRef.current && tabsRef.current.openTab) {
      tabsRef.current.openTab(zimId, path, title);
    }
  };

  return (
    <div className="p-4">
      <Home onOpenTab={openTab} />
      <ZimBrowserTabs ref={tabsRef} />
    </div>
  );
}
