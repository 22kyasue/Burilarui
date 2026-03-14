"""
Plan definitions and usage limit configuration.
"""

PLANS = {
    'free': {
        'name': 'Free',
        'display_name': 'フリー',
        'price_monthly': 0,
        'limits': {
            'active_trackings': 3,
            'searches_per_day': 10,
            'chats_per_day': 5,
            'messages_per_chat': 20,
        },
        'features': [
            '3件のアクティブ追跡',
            '1日10回の検索',
            '1日5回のチャット',
            'メール通知',
        ],
    },
    'pro': {
        'name': 'Pro',
        'display_name': 'プロ',
        'price_monthly': 9,
        'limits': {
            'active_trackings': -1,  # unlimited
            'searches_per_day': 100,
            'chats_per_day': -1,  # unlimited
            'messages_per_chat': -1,  # unlimited
        },
        'features': [
            '無制限の追跡',
            '1日100回の検索',
            '無制限のチャット',
            '優先実行',
            'メール・プッシュ通知',
            '詳細なレポート',
        ],
    },
    'enterprise': {
        'name': 'Enterprise',
        'display_name': 'エンタープライズ',
        'price_monthly': None,  # custom
        'limits': {
            'active_trackings': -1,
            'searches_per_day': -1,
            'chats_per_day': -1,
            'messages_per_chat': -1,
        },
        'features': [
            'すべてのPro機能',
            'API アクセス',
            'チーム管理',
            'カスタムSLA',
            '専任サポート',
        ],
    },
}


def get_plan(plan_name: str) -> dict:
    return PLANS.get(plan_name, PLANS['free'])


def get_limit(plan_name: str, limit_type: str) -> int:
    plan = get_plan(plan_name)
    return plan['limits'].get(limit_type, 0)
