import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-warm-400">
      {icon || <Inbox className="h-16 w-16" />}
      <p className="mt-4 text-lg font-medium text-warm-600">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-warm-400">{description}</p>
      )}
    </div>
  );
}
