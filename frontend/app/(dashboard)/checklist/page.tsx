import { ClipboardList } from 'lucide-react';

export default function ChecklistPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">제출 체크리스트</h1>
        <p className="text-gray-500 mt-1 text-base">공고 제출을 위한 준비사항을 확인하세요.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-28 text-center">
        <ClipboardList className="size-14 text-gray-200 mb-5" strokeWidth={1.5} />
        <p className="text-xl font-semibold text-gray-700">체크리스트 기능을 준비 중이에요</p>
        <p className="text-base text-gray-500 mt-2">곧 공고별 서류 체크리스트를 관리할 수 있어요</p>
      </div>
    </div>
  );
}
