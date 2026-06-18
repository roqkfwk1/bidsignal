import { AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function ApiErrorState({ onRetry, message = '나라장터 서버에 연결할 수 없어요.' }: ApiErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertCircleIcon className="size-12 text-red-400" strokeWidth={1.5} />
      <p className="text-lg font-medium text-gray-700">{message}</p>
      <p className="text-base text-gray-500">잠시 후 다시 시도해주세요.</p>
      <Button variant="outline" onClick={onRetry} className="mt-2">
        다시 시도
      </Button>
    </div>
  );
}
