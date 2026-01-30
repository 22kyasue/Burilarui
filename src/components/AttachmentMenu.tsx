import { useState, useRef, useEffect } from "react";
import { Plus, Paperclip, Triangle, Image as ImageIcon, Code, Wifi, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AttachmentMenuProps {
  onFileSelect?: (files: FileList) => void;
}

export function AttachmentMenu({ onFileSelect }: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems = [
    {
      icon: Paperclip,
      label: "ファイルをアップロード",
      action: () => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      },
    },
    {
      icon: Triangle,
      label: "ドライブから追加",
      action: () => console.log("ドライブから追加"),
    },
    {
      icon: ImageIcon,
      label: "フォト",
      action: () => console.log("フォト"),
    },
    {
      icon: Code,
      label: "コードをインポート",
      action: () => console.log("コードをインポート"),
    },
    {
      icon: Wifi,
      label: "NotebookLM",
      action: () => console.log("NotebookLM"),
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="追加"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="w-5 h-5 text-gray-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                >
                  <item.icon className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                  <span className="text-sm text-gray-800 group-hover:text-gray-900 transition-colors">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="*/*"
        onChange={(e) => {
          if (e.target.files && onFileSelect) {
            onFileSelect(e.target.files);
          }
        }}
      />
    </div>
  );
}