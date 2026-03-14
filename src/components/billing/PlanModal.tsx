import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { getPlans, getBillingStatus, createCheckout, createPortalSession } from '../../api/billing';
import type { PlanInfo, BillingStatus } from '../../api/billing';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  pro: Crown,
  enterprise: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  free: 'from-gray-400 to-gray-500',
  pro: 'from-indigo-500 to-purple-600',
  enterprise: 'from-amber-500 to-orange-600',
};

export default function PlanModal({ isOpen, onClose }: PlanModalProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([getPlans(), getBillingStatus()])
      .then(([p, s]) => { setPlans(p); setStatus(s); })
      .catch(() => toast.error('プラン情報の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const currentPlan = status?.plan || user?.plan || 'free';

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const url = await createCheckout();
      window.location.href = url;
    } catch {
      toast.error('チェックアウトの作成に失敗しました');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch {
      toast.error('ポータルの作成に失敗しました');
    }
  };

  const formatLimit = (value: number) => {
    if (value < 0) return '無制限';
    return `${value}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[85vh] z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-4 border-b border-gray-200/50 dark:border-gray-700 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">プランを選択</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  現在のプラン: <span className="font-semibold text-indigo-600">{status?.displayName || 'フリー'}</span>
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="p-6">
                {/* Usage Summary (if on a plan) */}
                {status && (
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <UsageCard
                      label="アクティブ追跡"
                      used={status.activeTrackings.used}
                      limit={status.activeTrackings.limit}
                    />
                    <UsageCard
                      label="本日の検索"
                      used={status.usage.searches_per_day.used}
                      limit={status.usage.searches_per_day.limit}
                    />
                    <UsageCard
                      label="本日のチャット"
                      used={status.usage.chats_per_day.used}
                      limit={status.usage.chats_per_day.limit}
                    />
                  </div>
                )}

                {/* Plan Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const Icon = PLAN_ICONS[plan.id] || Zap;
                    const gradient = PLAN_COLORS[plan.id] || 'from-gray-400 to-gray-500';
                    const isCurrent = currentPlan === plan.id;
                    const isUpgrade = plan.id === 'pro' && currentPlan === 'free';

                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-xl border p-5 transition-all ${
                          isCurrent
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                            現在のプラン
                          </div>
                        )}

                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.displayName}</h3>
                        <div className="mt-1 mb-4">
                          {plan.priceMonthly !== null ? (
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              ${plan.priceMonthly}
                              <span className="text-sm font-normal text-gray-500">/月</span>
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">お問い合わせ</span>
                          )}
                        </div>

                        {/* Limits */}
                        <div className="space-y-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>追跡</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{formatLimit(plan.limits.active_trackings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>検索/日</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{formatLimit(plan.limits.searches_per_day)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>チャット/日</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{formatLimit(plan.limits.chats_per_day)}</span>
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-1.5 mb-4">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        {isUpgrade && (
                          <button
                            onClick={handleUpgrade}
                            disabled={checkoutLoading}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {checkoutLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>アップグレード</>
                            )}
                          </button>
                        )}
                        {isCurrent && currentPlan === 'pro' && (
                          <button
                            onClick={handleManage}
                            className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            サブスクリプション管理
                          </button>
                        )}
                        {plan.id === 'enterprise' && (
                          <button
                            onClick={() => window.open('mailto:sales@burilar.com?subject=Enterprise Plan Inquiry', '_blank')}
                            className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            お問い合わせ
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit < 0;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isNearLimit = !isUnlimited && pct >= 80;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {used}{isUnlimited ? '' : ` / ${limit}`}
        {isUnlimited && <span className="text-xs font-normal text-gray-400 ml-1">無制限</span>}
      </div>
      {!isUnlimited && (
        <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
