'use client';

import { useEffect } from 'react';

interface SaveToastProps {
  show: boolean;
  onHide: () => void;
}

export function SaveToast({ show, onHide }: SaveToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onHide, 2000);
    return () => clearTimeout(timer);
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-5 py-3 text-base text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      관심 공고에 추가됐어요.
    </div>
  );
}
