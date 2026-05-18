import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-warm-100 flex items-center px-4 gap-3 sticky top-0 z-30">
      <button
        className="md:hidden p-1.5 rounded-lg hover:bg-warm-50 text-warm-600"
        onClick={onMenuToggle}
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold text-warm-800">{title}</h1>
    </header>
  );
}
