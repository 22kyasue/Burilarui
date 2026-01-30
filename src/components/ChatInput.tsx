import { useState, useRef, KeyboardEvent } from 'react';
import { Plus, Mic, Send, FileText, X } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { AttachmentMenu } from './AttachmentMenu';
import { motion, AnimatePresence } from 'framer-motion';

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isHome?: boolean;
  currentMode?: "default" | "pro";
  onModeChange?: (mode: "default" | "pro") => void;
}

export function ChatInput({ onSendMessage, isHome = false, currentMode, onModeChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(attachedFiles.filter((file) => file.id !== fileId));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // ドラッグ&ドロップハンドラー
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  // ペーストハンドラー
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        const newFiles: AttachedFile[] = files.map((file) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
        }));
        setAttachedFiles([...attachedFiles, ...newFiles]);
      }
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中はエンターキーを処理しない
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  };

  // テキストエリアにフォーカスを当てる関数
  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // カーソルを最後に移動
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  };

  if (isHome) {
    return (
      <div className="w-full relative">
        <div className="relative w-full max-w-5xl mx-auto z-20">
          <div 
            onClick={focusTextarea}
            className={`flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-3xl px-5 py-3.5 transition-all duration-300 cursor-text ${
              isFocused 
                ? 'border border-indigo-400 shadow-2xl ring-4 ring-indigo-100/50' 
                : 'shadow-lg hover:shadow-xl'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Burilar に相談"
              style={{
                transition: 'height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'height',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                perspective: 1000
              }}
              className="flex-1 bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 max-h-[200px] overflow-y-auto chat-input-textarea"
              rows={1}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="追加"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
              {currentMode && onModeChange && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ModeSelector currentMode={currentMode} onModeChange={onModeChange} />
                </div>
              )}
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="音声入力"
              >
                <Mic className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend();
                }}
                disabled={!input.trim()}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="送信"
              >
                <Send className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 bg-transparent relative">
      <div className="max-w-5xl mx-auto px-6 relative z-20">
        <div 
          ref={dropZoneRef}
          onClick={focusTextarea}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`bg-white/95 backdrop-blur-md rounded-3xl px-6 py-4 transition-all duration-300 cursor-text relative ${
            isFocused 
              ? 'border border-indigo-400 shadow-2xl ring-4 ring-indigo-100/50' 
              : 'shadow-lg hover:shadow-xl'
          } ${
            isDragging 
              ? 'border-2 border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-200/50' 
              : ''
          }`}
        >
          {/* Drag Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border-2 border-indigo-400">
                  <p className="text-lg font-medium text-indigo-600">
                    ファイルをドロップ
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached Files */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-3 space-y-2"
              >
                {attachedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3"
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.type || 'PDF'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                      className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                      aria-label="ファイルを削除"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder="メッセージを入力してください"
            style={{
              transition: 'height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              willChange: 'height',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              perspective: 1000
            }}
            className="w-full bg-transparent resize-none outline-none py-2 max-h-[200px] text-gray-900 placeholder-gray-400 overflow-y-auto chat-input-textarea"
            rows={1}
          />

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <AttachmentMenu 
                onFileSelect={(files) => {
                  const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  }));
                  setAttachedFiles([...attachedFiles, ...newFiles]);
                }}
              />
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {currentMode && onModeChange && (
                <ModeSelector currentMode={currentMode} onModeChange={onModeChange} />
              )}

              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="音声入力"
              >
                <Mic className="w-5 h-5 text-gray-500" />
              </button>

              {input.trim() && (
                <button
                  onClick={handleSend}
                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                  aria-label="送信"
                >
                  <Send className="w-5 h-5 text-indigo-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}