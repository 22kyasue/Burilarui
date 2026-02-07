import { ArrowLeft, Check, Crown, CreditCard, Calendar, TrendingUp, Zap, Download } from 'lucide-react';

interface PlanManagementProps {
  onBack: () => void;
  onChangePlan: () => void;

}

export function PlanManagement({ onBack, onChangePlan }: PlanManagementProps) {
  // 現在のプラン情報
  const currentPlan = {
    name: 'Pro',
    price: 2000,
    billingCycle: 'monthly',
    nextBillingDate: '2025年2月6日',
    startDate: '2024年12月6日',
  };

  // 使用状況
  const usage = {
    searches: { used: 245, limit: '無制限' },
    trackings: { used: 12, limit: '無制限' },
    notifications: { used: 89, limit: '無制限' },
  };

  // 請求履歴
  const billingHistory = [
    { date: '2025年1月6日', amount: 2000, status: '支払済み', invoice: 'INV-2025-001' },
    { date: '2024年12月6日', amount: 2000, status: '支払済み', invoice: 'INV-2024-012' },
    { date: '2024年11月6日', amount: 2000, status: '支払済み', invoice: 'INV-2024-011' },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec] overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左側：タイトル */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                プランを管理
              </h1>
              <p className="text-sm text-gray-600">
                現在のプラン状況と使用状況を確認できます
              </p>
            </div>

            {/* 右側：戻るボタン */}
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
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6" style={{ paddingBottom: '120px' }}>
        {/* Current Plan Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-indigo-500 shadow-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">Proプラン</h2>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    有効
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  ¥{currentPlan.price.toLocaleString()}/月 · {currentPlan.billingCycle === 'monthly' ? '月額払い' : '年額払い'}
                </p>
              </div>
            </div>
            <button
              onClick={onChangePlan}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              プランを変更
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">利用開始日</p>
              <p className="font-semibold text-gray-900">{currentPlan.startDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">次回請求日</p>
              <p className="font-semibold text-gray-900">{currentPlan.nextBillingDate}</p>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">含まれる機能</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">無制限のAI検索</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">無制限の追跡機能</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">高速な回答生成</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">優先サポート</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">通知機能</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">詳細なアナリティクス</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            今月の使用状況
          </h3>
          <div className="space-y-4">
            {/* AI検索 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">AI検索</span>
                <span className="text-sm text-gray-600">
                  {usage.searches.used} / {usage.searches.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            {/* 追跡 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">アクティブな追跡</span>
                <span className="text-sm text-gray-600">
                  {usage.trackings.used} / {usage.trackings.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>

            {/* 通知 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">受信通知数</span>
                <span className="text-sm text-gray-600">
                  {usage.notifications.used} / {usage.notifications.limit}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Method */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              お支払い方法
            </h3>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="w-12 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Visa •••• 4242</p>
                <p className="text-xs text-gray-600">有効期限: 12/26</p>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                変更
              </button>
            </div>
          </div>

          {/* Upgrade Option */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              さらに強力に
            </h3>
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">Ultraプラン</p>
                  <p className="text-sm text-gray-600">¥5,000/月</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Google AI Ultra統合、NotebookLM、APIアクセスなど
              </p>
              <button
                onClick={onChangePlan}
                className="w-full py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all text-sm"
              >
                Ultraにアップグレード
              </button>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            請求履歴
          </h3>
          <div className="space-y-3">
            {billingHistory.map((bill, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{bill.date}</p>
                    <p className="text-xs text-gray-600">{bill.invoice}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">¥{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-green-600">{bill.status}</p>
                  </div>
                  <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors" aria-label="請求書をダウンロード">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Plan */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">プランをキャンセル</h3>
          <p className="text-sm text-gray-600 mb-4">
            プランをキャンセルすると、次回請求日まで現在の機能をご利用いただけます。その後、Freeプランに自動的に移行されます。
          </p>
          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm">
            プランをキャンセル
          </button>
        </div>
      </div>
    </div>
  );
}