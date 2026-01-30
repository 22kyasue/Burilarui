import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModeSelectorProps {
  currentMode: "default" | "pro";
  onModeChange: (mode: "default" | "pro") => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const modes = [
    {
      id: "default" as const,
      label: "デフォルト",
      description: "素早く回答",
    },
    {
      id: "pro" as const,
      label: "Pro",
      description: "高度な分析と追跡機能",
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="モード選択"
      >
        <span className="text-xs font-medium text-gray-700">
          {currentMode === "pro" ? "Pro" : "デフォルト"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between gap-3 p-3 rounded-xl transition-all ${
                    currentMode === mode.id
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 mb-0.5">
                      {mode.label}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                  {currentMode === mode.id && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}