import { Sparkles } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: number;
  images?: string[];
}

interface TrackingRefinementChatProps {
  refinementMessages?: Message[]; // ブラッシュアップ専用のチャット履歴
  onSendMessage: (content: string) => void;
  currentMode?: "default" | "pro";
  onModeChange?: (mode: "default" | "pro") => void;
}

export function TrackingRefinementChat({
  refinementMessages = [],
  onSendMessage,
  currentMode = "pro",
  onModeChange,
}: TrackingRefinementChatProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [refinementMessages]);

  return (
    <>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto flex flex-col items-center bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] pb-4"
      >
        <div className="w-full mx-auto px-4 md:px-6 lg:px-8 py-6 pb-32 max-w-full">
          {/* 初期メッセージ - アシスタントからの質問 */}
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 mb-8">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-indigo-100">
                <p className="text-gray-800 leading-relaxed font-medium mb-3">
                  追跡プロンプトをさらにブラッシュアップしますか？
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  より正確な情報を追跡するために、プロンプトの改善案や追加の調査項目についてお気軽にご相談ください。例えば、特定の情報ソースの指定、調査の詳細度の調整、通知頻度の変更などをサポートします。
                </p>
              </div>
            </div>
          </div>

          {/* ブラッシュアップ専用のチャット履歴 */}
          {refinementMessages.length > 0 && (
            <div className="max-w-3xl mx-auto">
              {refinementMessages.map((message) => (
                <ChatMessage key={message.id} message={message} showWhiteBackground={true} />
              ))}
            </div>
          )}
          
          {/* スクロール用の参照ポイント */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <ChatInput 
          onSendMessage={onSendMessage} 
          isHome={false}
          currentMode={currentMode}
          onModeChange={onModeChange}
        />
      </div>
    </>
  );
}