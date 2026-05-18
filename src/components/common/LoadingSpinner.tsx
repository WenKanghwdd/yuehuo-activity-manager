import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-warm-500">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="mt-3 text-sm text-warm-600">{message}</p>
    </div>
  );
}
