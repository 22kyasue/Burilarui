import { useRef, useEffect } from 'react';
import { Upload, ImagePlus, Search, LayoutGrid, FolderOpen, Code } from 'lucide-react';

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
      className={`absolute z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 ${className}`}
    >
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        今後の機能
      </div>
      {menuItems.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500"
        >
          <Icon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          <span>{label}</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">準備中</span>
        </div>
      ))}
    </div>
  );
}
