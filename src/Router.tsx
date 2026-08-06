import { useState, useEffect } from 'react';
import App from './App';
import { TheVoid } from './pages/TheVoid';
import { SystemBreach } from './pages/SystemBreach';
import { HiddenSignal } from './pages/HiddenSignal';
import { Developer } from './pages/Developer';

export default function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Expose a navigate function globally for internal links
  useEffect(() => {
    (window as any).__navigate = (to: string) => {
      window.history.pushState({}, '', to);
      setPath(to);
    };
  }, []);

  const normalizedPath = path.replace(/\/+$/, '') || '/';

  useEffect(() => {
    if (normalizedPath === '/developer' || normalizedPath === '/dev') {
      window.location.href = 'https://hishamkh.me';
    }
  }, [normalizedPath]);

  switch (normalizedPath) {
    case '/void':
      return <TheVoid />;
    case '/breach':
      return <SystemBreach />;
    case '/signal':
      return <HiddenSignal />;
    case '/developer':
    case '/dev':
      return <Developer />;
    default:
      return <App />;
  }
}
