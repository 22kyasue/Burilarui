import { Chat } from '../types/chat';

export const DEMO_CHAT_DATA: Chat = {
    id: 'demo-unilever',
    title: 'ユニリーバのマーケティング戦略調査',
    updatedAt: new Date(),
    pinned: true,
    isTracking: true,
    trackingActive: true,
    updateCount: 3,
    thumbnail: 'https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjB0ZWFtfGVufDF8fHx8MTc2Njk5MTc4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    messages: [
        {
            id: 'msg-demo-1',
            role: 'user',
            content: 'FIFAワールドカップやUEFA EUROなどのスポーツスポンサーシップにおいて、Rexona（レクソーナ）やDove（ダヴ）などのブランドがどのような消費者参加型イベントやメッセージ発信（自信、ジェンダー平等など）を行っているか調査する。\n日本国内の消費者参加型エコプログラム「UMILE（ユーマイル）」について、現在のキャンペーン内容、対象店舗、回収ボックスの設置場所、消費者がどのように参加できるか詳しく調べる。\nダヴ（Dove）の「リアルビューティー」キャンペーンや「自己肯定感向上プロジェクト（Dove Self-Esteem Project）」について、日本国内の学校教育やワークショップでの実施事例、一般向けの教材提供などを調査する。\nラックス（LUX）が展開する「Social Damage Care」や採用バイアスに関するキャンペーンなど、ジェンダー平等や固定観念の打破を目指す具体的な活動内容を調べる。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
            id: 'msg-demo-2',
            role: 'assistant',
            content: 'ご提示いただいた設問（「印象的な取り組み」と「それへの貢献」）に対し、リサーチ結果に基づいた3つの理想的なストーリー構成案をご提案します。これらは、単に「すごいと思いました」という感想にとどまらず、「ユニリーバの戦略（コンパス）を深く理解している」ことと、「自分のキャリアビジョン」を論理的に接続させるための構成です。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000),
        }
    ],
    updates: [
        {
            id: 'u1',
            update: 'Lux（ラックス）の「Social Damage Care（社会的ダメージケア）」プロジェクトが、採用活動における性別欄・顔写真の撤廃を実現し、さらに競合他社や異業種（三井化学など）へ波及させるムーブメントを創出しました。単に「髪のダメージ」を修復するという製品機能を超えて、「履歴書の性別欄」という日本社会の根深い慣習にメスを入れ、他社を巻き込んだ社会変革のアクションとして機能しています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            sources: [
                { id: 's1', url: 'https://www.unilever.co.jp/news/press-releases/2023/lux-social-damage-care/', title: 'ユニリーバ・ジャパン: Lux Social Damage Care プロジェクト' },
                { id: 's2', url: 'https://www.advertimes.com/20230315/article405792/', title: 'AdverTimes: ラックスが挑む「社会的ダメージ」の解消' },
            ]
        },
        {
            id: 'u2',
            update: '日本国内の消費者参加型エコプログラム「UMILE（ユーマイル）」が、花王との連携により対象店舗を大幅に拡大しました。競合を超えた「共創（Co-creation）」により、消費者は全国の提携店舗で使用済み容器を回収ボックスに投入でき、サーキュラーエコノミーの実現に参加できるようになっています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            sources: [
                { id: 's3', url: 'https://www.unilever.co.jp/planet-and-society/umile/', title: 'ユニリーバ・ジャパン: UMILE プログラム公式サイト' },
                { id: 's4', url: 'https://www.kao.com/jp/corporate/news/sustainability/2023/20230420-001/', title: '花王: UMILEプログラムへの参画について' },
            ]
        },
        {
            id: 'u3',
            update: 'ダヴ（Dove）の「リアルビューティー」キャンペーンと「自己肯定感向上プロジェクト（Dove Self-Esteem Project）」が、日本国内の学校教育やワークショップでの実施事例を増やしています。一般向けの教材も無料で提供され、若年層の自己肯定感の向上とメディアリテラシーの育成に貢献しています。',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            sources: [
                { id: 's5', url: 'https://www.dove.com/jp/dove-self-esteem-project.html', title: 'Dove: 自己肯定感プロジェクト' },
                { id: 's6', url: 'https://www.unilever.co.jp/brands/personal-care/dove/', title: 'ユニリーバ・ジャパン: Dove ブランドサイト' },
            ]
        }
    ]
};
