import { ArrowLeft, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';
import { CheckoutModal } from './CheckoutModal';

interface PlanSelectionProps {
  onBack: () => void;
  currentPlan?: string;
}

export function PlanSelection({ onBack, currentPlan = 'free' }: PlanSelectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleUpgrade = (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;
    setCheckoutOpen(true);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      icon: Sparkles,
      color: 'from-gray-400 to-gray-500',
      features: [
        '基本的なAI検索機能',
        '月10回までの追跡',
        '標準的な回答速度',
        'コミュニティサポート',
      ],
      current: currentPlan === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 2000, yearly: 20000 },
      icon: Zap,
      color: 'from-indigo-500 to-purple-600',
      features: [
        '無制限のAI検索',
        '無制限の追跡機能',
        '高速な回答生成',
        '優先サポート',
        'アップデート通知（メール・プッシュ）',
        '詳細なアナリティクス',
        'カスタム検索頻度設定',
      ],
      popular: true,
    },
    {
      id: 'ultra',
      name: 'Ultra',
      price: { monthly: 5000, yearly: 50000 },
      icon: Crown,
      color: 'from-yellow-400 to-orange-500',
      features: [
        'Proの全機能',
        'Google AI Ultra統合',
        'NotebookLM機能',
        'APIアクセス',
        '専任サポート',
        'カスタムモデル',
        'チームコラボレーション（5名まで）',
        '高度なデータエクスポート',
      ],
    },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-end">
            {/* 戻るボタン */}
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">戻る</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12" style={{ paddingBottom: '120px' }}>
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            プランを選択
          </h1>
          <p className="text-sm text-gray-600">
            あなたに最適なプランを選択して、Burilarを最大限に活用しましょう
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${billingCycle === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            月単位
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all relative ${billingCycle === 'yearly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            年単位
            <span className="ml-2 text-xs">15% 割引</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const yearlyMonthlyPrice = Math.floor(plan.price.yearly / 12);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 transition-all ${plan.popular
                    ? 'border-2 border-indigo-500 shadow-md'
                    : 'border border-gray-200'
                  }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                      おすすめ
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {plan.current && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                      現在のプラン
                    </div>
                  </div>
                )}

                {/* Plan Icon & Name */}
                <div className="flex flex-col items-center mb-6 mt-2">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>

                  {/* Price */}
                  <div className="text-center">
                    {price === 0 ? (
                      <p className="text-3xl font-bold text-gray-900">無料</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900">
                          ¥{billingCycle === 'yearly' ? yearlyMonthlyPrice.toLocaleString() : price.toLocaleString()}
                          <span className="text-base text-gray-600 font-normal">/月</span>
                        </p>
                        {billingCycle === 'yearly' && (
                          <p className="text-xs text-gray-500 mt-1">
                            月単位の請求となります
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled={plan.current}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${plan.current
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                  {plan.current ? '現在のプラン' : 'アップグレード'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-10 text-center bg-white/60 backdrop-blur-sm rounded-2xl border border-indigo-100 p-6 max-w-2xl mx-auto">
          <p className="text-base text-gray-700 mb-2 font-medium">
            💎 全てのプランには14日間の無料トライアルが含まれます
          </p>
          <p className="text-sm text-gray-600">
            いつでもキャンセル可能・返金保証付き
          </p>
        </div>
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}