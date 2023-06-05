import { useEffect, useState } from 'react';

const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setConnectionStatus(true);
    const handleOffline = () => setConnectionStatus(false);

    window.addEventListener('online', () => handleOnline);
    window.addEventListener('offline', () => handleOffline);

    return () => {
      window.removeEventListener('online', () => handleOnline);
      window.removeEventListener('offline', () => handleOffline);
    };
  }, []);

  return connectionStatus;
};

export default useConnectionStatus;
