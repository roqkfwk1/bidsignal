import { BellOff } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림 내역</h1>
        <p className="text-gray-500 mt-1 text-base">중요한 알림을 확인하세요.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-28 text-center">
        <BellOff className="size-14 text-gray-200 mb-5" strokeWidth={1.5} />
        <p className="text-xl font-semibold text-gray-700">알림 서비스 준비 중이에요</p>
        <p className="text-base text-gray-500 mt-2">곧 마감 임박 알림을 받아볼 수 있어요</p>
      </div>
    </div>
  );
}
