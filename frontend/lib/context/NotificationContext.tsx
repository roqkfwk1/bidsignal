'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getUnreadCount } from '@/lib/api/notifications';
import { ACCESS_TOKEN_KEY } from '@/lib/api';

interface NotificationContextValue {
  unreadCount: number;
  decreaseUnreadCount: (by: number) => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  decreaseUnreadCount: () => {},
  clearUnreadCount: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  function decreaseUnreadCount(by: number) {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }

  function clearUnreadCount() {
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, decreaseUnreadCount, clearUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
