import { useRef, useEffect } from 'react';
import { Upload, ImagePlus, Search, LayoutGrid, FolderOpen, Code } from 'lucide-react';
import { toast } from 'sonner';

interface PlusMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const menuItems = [
  { label: 'ファイルアップロード', icon: Upload },
  { label: '画像を作る', icon: ImagePlus },
  { label: 'Deep Research', icon: Search },
  { label: 'キャンバス', icon: LayoutGrid },
  { label: 'プロジェクト', icon: FolderOpen },
  { label: 'コード', icon: Code },
];

export default function PlusMenu({ isOpen, onClose, className = '' }: PlusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 ${className}`}
    >
      {menuItems.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            toast('近日公開');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          {label}
        </button>
      ))}
    </div>
  );
}
