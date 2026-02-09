import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Mic, Send, X, FileText } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { AttachmentMenu } from './AttachmentMenu';
import { motion, AnimatePresence } from 'framer-motion';

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  file: File;
}

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: AttachedFile[]) => void;
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
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const processFiles = async (files: FileList | File[]) => {
    const newFiles: AttachedFile[] = [];

    for (const file of Array.from(files)) {
      let preview: string | undefined;

      if (file.type.startsWith('image/')) {
        try {
          preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } catch (e) {
          console.error('Failed to read file', e);
        }
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        preview,
        file
      });
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(attachedFiles.filter((file) => file.id !== fileId));
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
      processFiles(files);
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
        processFiles(files);
      }
    }
  };

  const handleSend = () => {
    if (input.trim() || attachedFiles.length > 0) {
      onSendMessage(input, attachedFiles);
      setInput('');
      setAttachedFiles([]);
      // Textarea height is handled by useEffect
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
  };

  // テキストエリアにフォーカスを当てる関数
  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  if (isHome) {
    return (
      <div className="w-full relative">
        <div className="relative w-full max-w-5xl mx-auto z-20">
          <div
            ref={dropZoneRef}
            onClick={focusTextarea}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`bg-white/95 backdrop-blur-xl rounded-3xl px-5 py-3.5 transition-all duration-300 cursor-text relative ${isFocused
              ? 'border border-indigo-400/60 shadow-2xl shadow-indigo-500/10 ring-4 ring-indigo-100/40'
              : 'border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-gray-300/50'
              } ${isDragging
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

            {/* Attached Files Grid - Compact Mode */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2 flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar py-1"
                >
                  {attachedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                          <FileText className="w-6 h-6 text-indigo-500" />
                        </div>
                      )}

                      {/* Delete Button (Persistent Badge) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.id);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-sm z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
              className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 max-h-[200px] overflow-y-auto chat-input-textarea min-h-[24px]"
              rows={1}
            />
            {/* Same controls as Chat Logic but simplified for Home if needed */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div onClick={(e) => e.stopPropagation()}>
                <AttachmentMenu onFileSelect={(files) => processFiles(files)} />
              </div>
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
                disabled={!input.trim() && attachedFiles.length === 0}
                className={`p-2 rounded-lg transition-all duration-200 ${input.trim() || attachedFiles.length > 0
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95'
                  : 'hover:bg-gray-100 text-gray-400'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="送信"
              >
                <Send className="w-4 h-4" />
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
          className={`bg-white/95 backdrop-blur-xl rounded-3xl px-6 py-4 transition-all duration-300 cursor-text relative ${isFocused
            ? 'border border-indigo-400/60 shadow-2xl shadow-indigo-500/10 ring-4 ring-indigo-100/40'
            : 'border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-gray-300/50'
            } ${isDragging
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

          {/* Attached Files Grid - Compact Mode */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-2 flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar py-1"
              >
                {attachedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                        <FileText className="w-6 h-6 text-indigo-500" />
                      </div>
                    )}

                    {/* Delete Button (Persistent Badge) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file.id);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-sm z-10"
                    >
                      <X className="w-3 h-3" />
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
            className="w-full bg-transparent resize-none outline-none py-2 max-h-[200px] text-gray-900 placeholder-gray-400 overflow-y-auto chat-input-textarea min-h-[24px]"
            rows={1}
          />

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <AttachmentMenu
                onFileSelect={(files) => processFiles(files)}
              />
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {currentMode && onModeChange && (
                <div className="hidden sm:block">
                  <ModeSelector currentMode={currentMode} onModeChange={onModeChange} />
                </div>
              )}

              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="音声入力"
              >
                <Mic className="w-5 h-5 text-gray-500" />
              </button>

              {(input.trim() || attachedFiles.length > 0) && (
                <button
                  onClick={handleSend}
                  className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 active:scale-95"
                  aria-label="送信"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}