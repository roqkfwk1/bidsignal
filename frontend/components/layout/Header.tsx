'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [showNotice, setShowNotice] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBellClick() {
    setShowNotice(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowNotice(false), 2500);
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-[220px] h-14 bg-white border-b border-gray-200 z-10 px-6 flex items-center justify-end">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBellClick}
          aria-label="알림 (준비 중)"
          className="relative"
        >
          <Bell className="size-5 text-gray-400" />
        </Button>

        {showNotice && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-11 right-0 bg-gray-900 text-white text-sm rounded-lg px-4 py-2.5 whitespace-nowrap z-50 shadow-lg"
          >
            알림 서비스를 준비 중이에요. 곧 마감 임박 알림을 받아볼 수 있어요.
          </div>
        )}
      </div>
    </header>
  );
}
