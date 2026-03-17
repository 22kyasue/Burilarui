import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqItems = [
  {
    question: 'Burilarとは？',
    answer: 'Burilarは、AIを活用したリアルタイム情報追跡・分析プラットフォームです。気になるトピックを登録するだけで、最新情報を自動で収集・整理し、わかりやすくお届けします。',
  },
  {
    question: '追跡機能の使い方',
    answer: '追跡したいトピックやキーワードを入力して「追跡開始」をクリックします。Burilarが定期的に最新情報をチェックし、新しい更新があれば通知でお知らせします。サイドバーから追跡中のトピック一覧を確認できます。',
  },
  {
    question: 'チャットについて',
    answer: 'チャット機能では、AIアシスタントと対話形式で情報を調べることができます。質問を入力すると、AIがリアルタイムで回答を生成します。会話履歴はサイドバーから確認・再開できます。',
  },
  {
    question: 'プランについて',
    answer: '無料プランでは基本的な追跡機能とチャットをご利用いただけます。PROプランにアップグレードすると、無制限の追跡、優先通知、高度な分析機能などをご利用いただけます。',
  },
  {
    question: 'お問い合わせ',
    answer: 'ご質問やフィードバックは feedback@burilar.com までお送りください。通常1-2営業日以内にご返信いたします。',
  },
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ヘルプとサポート</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* FAQ Accordion */}
              <div className="max-h-[60vh] overflow-y-auto">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
