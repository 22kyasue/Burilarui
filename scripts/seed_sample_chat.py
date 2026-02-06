
import json
import os
import time
from datetime import datetime, timedelta

def seed_sample_chat():
    data_file = "burilar_tracking_data.json"
    
    # Check if file exists
    if os.path.exists(data_file):
        with open(data_file, 'r') as f:
            data = json.load(f)
    else:
        data = {}

    # Define the sample plan
    plan_id = "sample_apple_intelligence_jp"
    base_time = datetime.now()
    
    plan = {
        "id": plan_id,
        "user_id": None,
        "topic": "Apple Intelligenceの日本展開と機能アップデート",
        "objective": "Track Japan release date, features, and device support",
        "frequency_hours": 24,
        "keywords": ["Apple Intelligence", "日本", "日本語", "iOS 18.1", "iPhone 16"],
        "status": "tracking",
        "active": True,
        "created_at": (base_time - timedelta(days=5)).isoformat(),
        "last_search_result": "# Apple Intelligenceの日本展開状況\n\nApple Intelligenceの日本語対応は、2025年4月のiOS 18.4アップデートで提供開始される予定です。当初は2025年中の予定でしたが、具体的な時期が明らかになりました。\n\n## 主な機能\n- 作文ツール（校正、要約、書き換え）\n- Genmoji（ジェネレーティブ絵文字）\n- 写真のクリーンアップ機能\n- Siriの大幅な強化（画面認識、アプリ間操作）\n\n## 対応デバイス\n- iPhone 16全モデル\n- iPhone 15 Pro / Pro Max\n- M1以降を搭載したiPadとMac\n\n日本語対応の遅れは、言語モデルの調整と規制対応が要因とされています。",
        "last_search_time": base_time.isoformat(),
        "next_search_time": (base_time + timedelta(hours=24)).isoformat(),
        "original_query": "Apple Intelligenceの日本での提供開始時期と対応機能について教えて",
        "suggested_prompt": "Apple Intelligenceの日本展開に関して、日本語対応の具体的な開始時期、対応する機能の範囲、および対応デバイスの最新情報を継続的に追跡してください。",
        "updates": [
            {
                "timestamp": (base_time - timedelta(days=3)).isoformat(),
                "update": "【速報】iOS 18.2ベータ版で英語以外の言語サポートの痕跡が発見されました。日本語対応の準備が着実に進んでいることが示唆されています。",
                "sources": [
                    {"id": "s1", "url": "https://9to5mac.com/2024/10/23/ios-18-2-apple-intelligence-languages/", "title": "9to5Mac: iOS 18.2 beta reveals new Apple Intelligence language support"},
                    {"id": "s2", "url": "https://www.macrumors.com/2024/10/24/ios-18-2-apple-intelligence-more-languages/", "title": "MacRumors: Apple Intelligence Expanding to More Languages Soon"}
                ]
            },
            {
                "timestamp": (base_time - timedelta(days=1)).isoformat(),
                "update": "著名アナリストによると、Appleは日本語を含むアジア言語のサポートを加速させており、2025年春のリリースに向けて開発リソースを集中させているとのことです。",
                "sources": [
                    {"id": "s3", "url": "https://www.bloomberg.com/news/articles/2024-10-25/apple-intelligence-asia-expansion", "title": "Bloomberg: Apple Accelerates AI Rollout in Asia"},
                    {"id": "s4", "url": "https://nikkei.com/technology/apple-intelligence-japan", "title": "Nikkei Asia: Apple's AI push in Japan"}
                ]
            },
            {
                "timestamp": base_time.isoformat(),
                "update": "最新のレポートでは、日本国内でのApple Intelligence機能の一部（特にChatGPT統合）が、規制当局との協議により調整中である可能性が報じられています。",
                "sources": [
                     {"id": "s5", "url": "https://www.reuters.com/technology/apple-talks-japan-regulators-ai-2024-10-27/", "title": "Reuters: Apple in talks with Japan regulators over AI features"}
                ]
            }
        ],
        "image_url": "https://www.apple.com/newsroom/images/2024/09/apple-intelligence-is-available-today/article/Apple-Intelligence-available-today-hero_big.jpg.large.jpg"
    }

    # Add/Update the plan
    data[plan_id] = plan

    # Save tracking plans
    with open(data_file, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Sample plan '{plan['topic']}' seeded successfully.")

if __name__ == "__main__":
    seed_sample_chat()
