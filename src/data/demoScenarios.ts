export interface RefinementScenario {
    id: string;
    title: string;
    theme: string; // e.g., "Apple Intelligence"
    topic: string; // e.g., "最新動向"
    status: "active" | "paused";
    priority: "必ビジ追中" | "高" | "中" | "低";

    // AI Recommended Structure
    recommendedPrompt: string;
    structureItems: {
        color: string; // "indigo" | "purple" | "pink" | "amber" | "emerald"
        title: string;
        description: string;
    }[];

    // Future Tracking Flow
    missingPoints: {
        text: string;
    }[];
    notificationTriggers: {
        text: string;
    }[];
}

export const demoScenarios: Record<string, RefinementScenario> = {
    "Apple Intelligence": {
        id: "apple-intelligence",
        title: "Apple Intelligenceの2024〜2025年の最新動向",
        theme: "Apple Intelligence",
        topic: "最新動向",
        status: "active",
        priority: "必ビジ追中",
        recommendedPrompt: "「Apple Intelligenceについて、2024年から2025年にかけての最新動向を業界リサーチ目的で継続的に追跡してください。特に、生成AIやオンデバイスAI、OSとの統合などに関する新機能・技術アップデートと、日本市場における対応状況（日本語対応の進捗、提供開始時期、対応デバイスの拡大）を重点的に把握したいです。情報源はAppleの公式発表および信頼性の高い海外テックメディアを中心とし、重要な変化が確認された場合のみ通知してください。その際は、変化の内容とそれがAppleのAI戦略や市場において持つ意味を簡潔に説明してください。」",
        structureItems: [
            {
                color: "indigo",
                title: "期間の明確化",
                description: "追跡期間を具体的に指定することで、関連性の高い情報に絞り込めます",
            },
            {
                color: "purple",
                title: "具体的な観点の列挙",
                description: "複数の観点を明示することで、包括的な追跡が可能になります",
            },
            {
                color: "pink",
                title: "アクション条件の設定",
                description: "どんな時に通知が欲しいかを明記することで、ノイズを削減できます",
            },
        ],
        missingPoints: [
            { text: "2025年第2四半期以降の具体的なリリーススケジュール" },
            { text: "日本語版の完全対応時期と機能の制限事項" },
            { text: "新型iPhone/iPad/Macの発表および対応状況" },
            { text: "第三者評価機関による最新のプライバシー監査結果" },
        ],
        notificationTriggers: [
            { text: "Apple公式サイトで新しいアップデートや機能が発表されたとき" },
            { text: "主要テックメディアが日本語対応の進捗を報じたとき" },
            { text: "新型デバイスの発表や対応機種リストの更新があったとき" },
            { text: "プライバシー技術に関する重要な分析レポートが公開されたとき" },
            { text: "毎日9:00の定期チェックで新しい情報が検出されたとき" },
        ],
    },
    "Tesla Competitor Analysis": {
        id: "tesla-analysis",
        title: "テスラの競合分析（EV市場シェア・自動運転）",
        theme: "Tesla Competitor Analysis",
        topic: "競合分析",
        status: "active",
        priority: "必ビジ追中",
        recommendedPrompt: "「テスラのEV市場シェアと自律走行技術（FSD）における競合他社との比較について、最新の情報を基に継続的に追跡してください。特に、中国市場でのBYDなどとの価格競争やシェア推移、およびFSDの技術進展と他社（Waymo, Huawei等）との比較を重点的に把握したいです。四半期ごとの決算発表や主要な販売速報をトリガーとし、重要な市場の変化があった場合に通知してください。」",
        structureItems: [
            {
                color: "amber",
                title: "比較軸の明確化",
                description: "市場シェアと技術力の2軸で比較することを明示し、分析の解像度を高めます",
            },
            {
                color: "emerald",
                title: "具体的競合の指定",
                description: "BYDやWaymoなど具体的な比較対象を挙げることで、より深い分析を促します",
            },
            {
                color: "indigo",
                title: "トリガーイベントの設定",
                description: "決算発表など具体的なイベントを通知の契機として設定しています",
            },
        ],
        missingPoints: [
            { text: "BYDの最新の海外輸出比率と欧州での販売動向" },
            { text: "テスラFSD v12の中国当局による認可の最終ステータス" },
            { text: "Rivian / Lucid 等の新興EVメーカーの最新の財務健全性" },
        ],
        notificationTriggers: [
            { text: "テスラおよび主要競合（BYD, VW等）の四半期決算が発表されたとき" },
            { text: "各国でのEV補助金政策に変更があったとき" },
            { text: "FSDの安全性能に関する公的な調査レポートが出たとき" },
            { text: "主要市場（米・中・欧）での月次販売シェアに1%以上の変動があったとき" },
        ],
    },
};
