import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { CollapsedSidebar } from "./components/CollapsedSidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { TrackingPage } from "./components/TrackingPage";
import { TrackingListView } from "./components/TrackingListView";
import { NotificationSettings } from "./components/NotificationSettings";
import { HomePage } from "./components/HomePage";
import { NotebookCreationModal } from "./components/NotebookCreationModal";
import { UpdatePanel } from "./components/UpdatePanel";
import { PlanSelection } from "./components/PlanSelection";
import { PlanManagement } from "./components/PlanManagement";
import { TrackingSuggestionCard } from "./components/TrackingSuggestionCard";
import { TrackingStatusBadge } from "./components/TrackingStatusBadge";
import { TrackingDetail } from "./components/TrackingDetail";
import { TrackingRefinementChat } from "./components/TrackingRefinementChat";
import { TrackingSuccessMessage } from "./components/TrackingSuccessMessage";
import { DefaultModeTrackingDetail } from "./components/DefaultModeTrackingDetail";
import { SimpleTrackingSetup } from "./components/SimpleTrackingSetup";
import { Header } from "./components/Header";
import { SettingsModal } from "./components/SettingsModal";
import { IntegrationScreen } from "./components/IntegrationScreen";
import { TrackingSettingsScreen } from "./components/TrackingSettingsScreen";
import { Menu, Sparkles, Bell } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: number;
  images?: string[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  pinned?: boolean;
  isTracking?: boolean;
  trackingActive?: boolean;
  updateCount?: number;
  trackingFrequency?: string;
  notificationEnabled?: boolean;
  notificationGranularity?: "update" | "prompt";
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldScrollToHistory, setShouldScrollToHistory] = useState(false);
  const [currentMode, setCurrentMode] = useState<"default" | "pro">("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentView, setCurrentView] = useState<
    | "home"
    | "chat"
    | "tracking"
    | "trackingList"
    | "notifications"
    | "planSelection"
    | "planManagement"
    | "integrations"
    | "trackingSettings"
  >("home");
  const [trackingPromptId, setTrackingPromptId] = useState<
    string | null
  >(null);
  const [isNotebookModalOpen, setIsNotebookModalOpen] =
    useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] =
    useState(false);
  const [trackingSuggestions, setTrackingSuggestions] =
    useState<
      Array<{
        messageId: string;
        query: string;
        accepted: boolean;
      }>
    >([
      {
        messageId: "ai-m1",
        query: "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。",
        accepted: false,
      },
    ]);
  const [activeTracking, setActiveTracking] = useState<{
    theme: string;
    frequency: string;
    startTime?: Date;
  } | null>(null);
  const [isTrackingDetailOpen, setIsTrackingDetailOpen] =
    useState(false);
  const [isDefaultModeDetailOpen, setIsDefaultModeDetailOpen] =
    useState(false);
  
  // SimpleTrackingSetupとDetailの切り替え状態
  const [showSimpleTrackingSetup, setShowSimpleTrackingSetup] = useState(false);
  const [showDetailSettings, setShowDetailSettings] = useState(false);
  
  // ブラッシュアップモード専用のチャット履歴
  const [refinementMessages, setRefinementMessages] = useState<Message[]>([]);
  
  // トラッキング提案カードへの参照を保持
  const trackingSuggestionCardRef = useRef<HTMLDivElement>(null);
  
  // メインチャット画面のスクロール用ref
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // TrackingStatusBadgeへの参照
  const trackingStatusBadgeRef = useRef<HTMLDivElement>(null);
  
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "apple-intelligence",
      title: "Apple Intelligenceの最新動向",
      messages: [
        {
          id: "ai-m1",
          content:
            "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。",
          role: "user",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
        },
        {
          id: "ai-m2",
          content: `Appleは2024〜2025年にかけて、生成AI基盤「Apple Intelligence」を発表し、2025年にも追加アップデートを行っています。2025年時点での動きは「新発表」「拡張」「順次リリース済み」の三つに整理できます。

## 新しい発表（2025年）

- WWDC25で、Live Translation（リアルタイム翻訳）、画面内容を理解するVisual Intelligence拡張、Apple Intelligence向けAPIなどを追加発表。[apple:+3]

- 秋には、これら新機能の一部が実際に使えるようになったことが公式に案内されています。[apple]

## 以前の発表からの変更・拡張

- 2024年の初期発表内容（Writing Tools、Genmoji、Image Playground、Siri強化、ChatGPT連携など）は維持されつつ、対象領域や統合の深さが広がる方向で拡張。[techcrunch:+2]

- 大きな方針転換や機能撤回というより、「Live Translation」「Visual Intelligence」などを中核に、システム横断の体験として整理し直した形です。[apple:+3]

## 実際にリリースされた主な機能

- **文章系**：Writing Tools（リライト・要約・校正）、通知・メール要約、スマート返信。[apple:+1]

- **画像系**：PhotosのClean Up、Genmoji、Image Playground、Image Wandなどの生成系機能。[techcrunch:+2]

- **アシスタント系**：新Siri UIとType to Siri、製品ナレッジ強化、ChatGPT連携。[techcrunch:+1]

- **2025年追加**：Live Translation、画面コンテンツを理解して提案するVisual Intelligence拡張などがOSアップデートとして順次提供済みです。[apple:+1]`,
          role: "assistant",
          timestamp: new Date(Date.now() - 1000 * 60 * 4),
          sources: 6,
          images: [
            "https://images.unsplash.com/photo-1738641928061-e68c5e8e2f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcHBsZSUyMGludGVsbGlnZW5jZSUyMGFpJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3Njc0MjQ1NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            "https://images.unsplash.com/photo-1658494603398-2def8bb2742a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpUGhvbmUlMjBBSSUyMGZlYXR1cmVzfGVufDF8fHx8MTc2NzQyNDU0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          ],
        },
      ],
      updatedAt: new Date(Date.now() - 1000 * 60 * 4),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "1",
      title: "React開発のベストプラクティス",
      messages: [
        {
          id: "1",
          content: "Reactのベストプラクティスを教えてください",
          role: "user",
          timestamp: new Date(Date.now() - 86400000 * 2),
        },
        {
          id: "2",
          content:
            "Reactのベストプラクティスをいくつかご紹介します...",
          role: "assistant",
          timestamp: new Date(Date.now() - 86400000 * 2),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 2),
      pinned: true,
      isTracking: true,
      trackingActive: true,
      updateCount: 3,
    },
    {
      id: "1-1",
      title: "AIモデルの最新トレンド",
      messages: [
        {
          id: "m1-1-1",
          content:
            "以下の技術分野について最新トレンドを調査してください：\n\n【調査項目】\n1. 技術概要と進化\n   - 技術の基本原理と最新の発展状況\n   - 主要な技術的ブレークスルー（過去1-2年）\n   - 技術成熟度（Gartnerハイプサイクル等）\n\n2. 市場動向\n   - 市場規模と成長予測\n   - 主な資トレンドとVC動向\n   - 企業にる技術導入率\n\n【技術分野】: AIモデルの最新トレンド",
          role: "user",
          timestamp: new Date(Date.now() - 1000 * 60 * 16),
        },
        {
          id: "m1-1-2",
          content: `AIモデルの最新トレンドに関する包括的な回答です。各アップデートのを統合し、実用的なストプラクィスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
        },
      ],
      updatedAt: new Date(Date.now() - 1000 * 60 * 15), // 15分前
      pinned: false,
      isTracking: true,
      trackingActive: true,
      updateCount: 1,
    },
    {
      id: "1-2",
      title: "ユニリーバのマーティング戦略調査",
      messages: [
        {
          id: "m1-2-1",
          content:
            "FIFAワールドカップやUEFA EUROなどのスポーツスポンサーシップにおいて、Rexona（レクソーナ）やDove（ダヴ）などのブランドがどのような消費者参加型イベントやメッセージ発信（自信、ジェンダー平等など）を行っているか調査する。\n日本国内の消費者参加型エコプログラム「UMILE（ユーマイル）」について、現在のキャンペーン内容、対象店舗、回収ボックスの設置場所、消費者がどのように参加できるか詳しく調べる。\nダヴ（Dove）の「リアルビューティー」キャンペーンや「自己肯定感向上プロジェクト（Dove Self-Esteem Project）」について、日本国内の学校教育やワークショップでの実施事例、一般向けの教材提供などを調査する。\nラックス（LUX）が展開する「Social Damage Care」や採用バイアスに関するキャンペーンなど、ジェンダー平等や固定観念の打破を目指す具体的な活動内容を調べる。",
          role: "user",
          timestamp: new Date(Date.now() - 1000 * 60 * 46),
        },
        {
          id: "m1-2-2",
          content: `ユニリーバのマーケティング戦略調査に関する最新のアップデート情報を含む包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
        },
      ],
      updatedAt: new Date(Date.now() - 1000 * 60 * 45), // 45分前
      pinned: true,
      isTracking: true,
      trackingActive: false,
      updateCount: 4,
    },
    {
      id: "2",
      title: "カリスマ宣言師",
      messages: [
        {
          id: "3",
          content: "TypeScriptの型システムについて詳しく",
          role: "user",
          timestamp: new Date(Date.now() - 86400000 * 5),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 5),
      pinned: false,
      isTracking: true,
      trackingActive: false,
      updateCount: 7,
    },
    {
      id: "3",
      title:
        "Badminton Doubles: Teamwork and Effective Strategies",
      messages: [
        {
          id: "m3-1",
          content:
            "Badminton Doublesにおけるチームワークと効果的な戦略について調査してください。",
          role: "user",
          timestamp: new Date(
            Date.now() - 86400000 * 3 - 1000 * 60,
          ),
        },
        {
          id: "m3-2",
          content: `Badminton Doubles: Teamwork and Effective Strategiesに関する最新の包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 86400000 * 3),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 3),
      pinned: false,
      isTracking: true,
      trackingActive: true,
      updateCount: 2,
    },
    {
      id: "4",
      title: "広告代理店向け自己PR戦略概要案",
      messages: [
        {
          id: "m4-1",
          content:
            "広告代理店への就職活動における効果的な自己PR戦略について、業界特性を踏まえた概要案を作成してください。",
          role: "user",
          timestamp: new Date(
            Date.now() - 86400000 * 4 - 1000 * 60,
          ),
        },
        {
          id: "m4-2",
          content: `広告代理店向け自己PR戦略概要案に関する最新の包括的な回答です。各アップデートの内容を統合し、用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 86400000 * 4),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 4),
      pinned: true,
      isTracking: true,
      trackingActive: false,
      updateCount: 5,
    },
    {
      id: "5",
      title: "JPモルガンAM営業回答チアドバイス",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 5),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "6",
      title: "70分手がラダブ作成の教え方",
      messages: [
        {
          id: "m6-1",
          content:
            "70分で効果的なラブレターの作方法について教えてください。",
          role: "user",
          timestamp: new Date(
            Date.now() - 86400000 * 6 - 1000 * 60,
          ),
        },
        {
          id: "m6-2",
          content: `70分手がラダブ作成の教え方に関する最新の包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含め全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 86400000 * 6),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 6),
      pinned: true,
      isTracking: true,
      trackingActive: true,
      updateCount: 1,
    },
    {
      id: "7",
      title: "Influenza Certificate Delivery Update",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 7),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "8",
      title: "アメリカ有害管理ブランド・ストラテジ...",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 8),
      pinned: true,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "9",
      title: "応募書類の回答方式ガイド",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 9),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "10",
      title: "ニーチェの「神の死」を解説",
      messages: [
        {
          id: "m10-1",
          content:
            "ニーチェの「神の死」という概念について、哲学的背景と現代社会への影響を詳しく解説してください。",
          role: "user",
          timestamp: new Date(
            Date.now() - 86400000 * 10 - 1000 * 60,
          ),
        },
        {
          id: "m10-2",
          content: `ニーチェの「神の死」を解説に関する最新の包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されます。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`,
          role: "assistant",
          timestamp: new Date(Date.now() - 86400000 * 10),
        },
      ],
      updatedAt: new Date(Date.now() - 86400000 * 10),
      pinned: false,
      isTracking: true,
      trackingActive: true,
      updateCount: 12,
    },
    {
      id: "11",
      title: "コピーライダーの度器購受け示価",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 11),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "12",
      title: "動画投稿の要約と考",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 12),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "13",
      title: "迷プロポーズへの返答",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 13),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "14",
      title: "JP Morgan's Industry Focus: AI",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 14),
      pinned: true,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "15",
      title: "JPモガン戦量回復：やかりと繊細...",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 15),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "16",
      title: "声と顔特許で促も速度を契明",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 16),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
    {
      id: "17",
      title: "面倒不審期のたの回答本可",
      messages: [],
      updatedAt: new Date(Date.now() - 86400000 * 17),
      pinned: false,
      isTracking: false,
      trackingActive: false,
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<
    string | null
  >("apple-intelligence");

  const currentChat = currentChatId
    ? chats.find((chat) => chat.id === currentChatId)
    : null;

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !currentChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: new Date(),
              title:
                chat.messages.length === 0
                  ? content.slice(0, 30)
                  : chat.title,
            }
          : chat,
      ),
    );
  };

  // ブラッシュアップモード専用のメッセージ送信ハンドラー
  const handleRefinementMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setRefinementMessages((prev) => [...prev, userMessage]);

    // AIの応答をシミュレート（実際のAPIコールに置き換え可能）
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `プロンプトのブラッシュアップについてのご質問ありがとうございます。${content}について、より具体的な改善をご提案いたします。`,
        role: "assistant",
        timestamp: new Date(),
      };
      setRefinementMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleNewChat = () => {
    // ホームの検索画面に移動
    setCurrentView("home");
    setCurrentChatId(null);
    setTrackingPromptId(null);
    setActiveTracking(null);
  };

  const handleViewHome = () => {
    // ホーム画面に移動
    setCurrentView("home");
    setCurrentChatId(null);
    setTrackingPromptId(null);
    setActiveTracking(null);
  };

  const handleCreateNotebook = (
    title: string,
    prompt: string,
    template?: string,
    trackingFrequency?: string,
    notificationEnabled?: boolean,
    notificationGranularity?: "update" | "prompt",
  ) => {
    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();

    // 初期回答を生成
    const initialResponse = `ユーーバのマーケティング戦略調査に関する最新のアップデート情報を含む包括的な回答です。各アップデートの内容を統合し、実用的なベストプラクティスと具体的な実装例を提供します。

**情報:**

詳細な技術解説、実装パターン、パフォーマンス最適化の手法、そして実際のユースケースを含めた完全な回答がここに表示されま。 📝

**文献:**

[1] Example Article on Recent Developments
https://example.com/article1

[2] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[3] Example Article on Recent Developments
https://example.com/article1

[4] Research Paper: Latest Findings and Analysis
https://research.example.org/paper

[5] Example Article on Recent Developments
https://example.com/article1

[6] Research Paper: Latest Findings and Analysis
https://research.example.org/paper`;

    const newChat: Chat = {
      id: Date.now().toString(),
      title: title,
      messages: [
        {
          id: userMessageId,
          content: prompt,
          role: "user",
          timestamp: new Date(),
        },
        {
          id: assistantMessageId,
          content: initialResponse,
          role: "assistant",
          timestamp: new Date(Date.now() + 100),
        },
      ],
      updatedAt: new Date(),
      isTracking: true,
      trackingActive: false, // 初期は中断中
      updateCount: 0,
      trackingFrequency: trackingFrequency || "daily",
      notificationEnabled: notificationEnabled || false,
      notificationGranularity:
        notificationGranularity || "update",
    };
    setChats([newChat, ...chats]);
    setIsNotebookModalOpen(false);

    // 新しく作成したノートブックのトラッキングページに移動
    setTrackingPromptId(newChat.id);
    setCurrentView("tracking");
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chats.find(
      (chat) => chat.id === chatId,
    );

    // 追跡中のチャットの場合は、TrackingPageを表示
    if (selectedChat?.isTracking) {
      setTrackingPromptId(chatId);
      setCurrentChatId(null); // 通常のチャットIDをクリア
      setCurrentView("tracking");
    } else {
      setCurrentChatId(chatId);
      setTrackingPromptId(null); // 追跡中のチャットIDをクリア
      setCurrentView("chat");
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prevChats) =>
      prevChats.filter((chat) => chat.id !== chatId),
    );
    if (currentChatId === chatId && chats.length > 1) {
      const remainingChats = chats.filter(
        (chat) => chat.id !== chatId,
      );
      setCurrentChatId(remainingChats[0].id);
    } else if (chats.length === 1) {
      handleNewChat();
    }
  };

  const handleTogglePin = (chatId: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? { ...chat, pinned: !chat.pinned }
          : chat,
      ),
    );
  };

  // 初回マウント時にローディングを3秒間表示
  useEffect(() => {
    // 2.5秒後にフェードアウト開始
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // 3秒後に完全非表示
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // メインチャット画面のメッセージが更新されたら自動スクロール
  useEffect(() => {
    if (currentChat && currentChat.messages.length > 0 && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, [currentChat?.messages]);

  // パネルが閉じた時にTrackingStatusBadgeが画面中央に来るようにスクロール
  useEffect(() => {
    if (!isTrackingDetailOpen && !isDefaultModeDetailOpen && trackingStatusBadgeRef.current) {
      setTimeout(() => {
        trackingStatusBadgeRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "center"
        });
      }, 100); // パネルのクローズアニメーション後にスクロール
    }
  }, [isTrackingDetailOpen, isDefaultModeDetailOpen]);

  // ローディング画面
  if (isLoading) {
    return (
      <div
        className={`flex h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 items-center justify-center overflow-hidden transition-opacity duration-500 ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-center">
          {/* ロゴテキスト */}
          <div className="mb-8 animate-[logo-fade-in_2s_ease-out]">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Burilar
            </h1>
          </div>

          {/* アニメーション円 */}
          <div className="flex justify-center items-center gap-3 animate-[fade-in-up_1.5s_ease-out_0.5s_both]">
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>

          {/* サブテキスト */}
          <p className="mt-8 text-gray-600 text-sm animate-[fade-in-up_1.5s_ease-out_0.8s_both]">
            AIで追跡、情報を常に最新に
          </p>
        </div>

        {/* 背景の装飾的な円 */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-40 blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]' 
        : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
    }`}>
      {/* Notebook Creation Modal */}
      <NotebookCreationModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
        onCreateNotebook={handleCreateNotebook}
      />

      {/* Sidebar - shown in all views */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        trackingPromptId={trackingPromptId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onViewTracking={() => {
          setTrackingPromptId(null);
          setCurrentView("trackingList");
        }}
        onViewNotificationSettings={() => {
          setCurrentView("notificationSettings");
        }}
        onViewHome={handleViewHome}
        onViewSettings={() => setIsSettingsModalOpen(true)}
        shouldScrollToHistory={shouldScrollToHistory}
        onScrollToHistoryComplete={() => setShouldScrollToHistory(false)}
        theme={theme}
      />

      {/* Collapsed Sidebar - shown when sidebar is closed */}
      {!isSidebarOpen && (
        <CollapsedSidebar
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNewChat={handleNewChat}
          onViewTracking={() => {
            setTrackingPromptId(null);
            setCurrentView("trackingList");
          }}
          onViewNotificationSettings={() => {
            setCurrentView("notifications");
          }}
          onViewSettings={() => {
            setIsSettingsModalOpen(true);
          }}
          onScrollToHistory={() => {
            setShouldScrollToHistory(true);
          }}
          theme={theme}
        />
      )}

      {/* Main Content Area - with margin when sidebar is open */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-16"
        }`}
      >
        {/* Fixed Header - shown in all views */}
        <Header
          onLogoClick={handleNewChat}
          unreadCount={8}
          onNotificationClick={() => setIsUpdatePanelOpen(true)}
          onProClick={() => {}} // 無効化
          theme={theme}
        />

        <AnimatePresence mode="wait">
          {currentView === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <HomePage
                chats={chats}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                onViewPlan={() =>
                  setCurrentView("planSelection")
                }
                onViewUpdatePanel={() =>
                  setIsUpdatePanelOpen(true)
                }
                currentMode={currentMode}
                onModeChange={setCurrentMode}
                theme={theme}
                onSendMessage={(message) => {
                  // 新しいチャットを作成
                  const newChatId = Date.now().toString();
                  const userMessage: Message = {
                    id: Date.now().toString(),
                    content: message,
                    role: "user",
                    timestamp: new Date(),
                  };

                  const newChat: Chat = {
                    id: newChatId,
                    title: message.slice(0, 30),
                    messages: [userMessage],
                    updatedAt: new Date(),
                  };

                  setChats((prev) => [newChat, ...prev]);
                  setCurrentChatId(newChatId);
                  setCurrentView("chat");

                  // AIの応答をシミュレート
                  setTimeout(() => {
                    const assistantMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      content: `「${message}」についての回答です。\n\nこちらは検索結果に基づいた詳細な情報となります。`,
                      role: "assistant",
                      timestamp: new Date(),
                      sources: 6,
                    };

                    setChats((prevChats) =>
                      prevChats.map((chat) =>
                        chat.id === newChatId
                          ? {
                              ...chat,
                              messages: [...chat.messages, assistantMessage],
                              updatedAt: new Date(),
                            }
                          : chat,
                      ),
                    );

                    // トラッキング提案を追加
                    setTrackingSuggestions((prev) => [
                      ...prev,
                      {
                        messageId: userMessage.id,
                        query: message,
                        accepted: false,
                      },
                    ]);
                  }, 1000);
                }}
                onOpenTrackingDetail={(theme, query) => {
                  // 直接TrackingDetailを開く
                  setActiveTracking({
                    theme: theme,
                    frequency: "毎日 9:00",
                  });
                  
                  // ブラッシュアップチャットの初期対話を設定
                  const initialRefinementMessages: Message[] = [
                    {
                      id: "refine-ai-1",
                      content: `この情報を追跡する目的を教えてください。\n例：\n・投資判断\n・プロダクト企画\n・業界リサーチ\n・個人の情報収集 など`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 6000),
                    },
                    {
                      id: "refine-user-1",
                      content: "業界リサーチです。\n特にAppleがAI分野でどこまで本気なのかを継続的に把握したいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 5000),
                    },
                    {
                      id: "refine-ai-2",
                      content: `業界リサーチとのことですが、特に重視したい観点はありますか？\n複数選択でも構いません。\n\n・機能・技術（生成AI、オンデバイスAIなど）\n・ビジネス戦略・競争環境\n・プライバシー・規制対応\n・日本市場への影響\n・他社（OpenAI / Google / Microsoft等）との比較`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 4000),
                    },
                    {
                      id: "refine-user-2",
                      content: "機能・技術と、日本市場への影響は特に知りたいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 3000),
                    },
                    {
                      id: "refine-ai-3",
                      content: `追跡する情報ソースについて、希望はありますか？\n例：\n・Apple公式（発表、WWDC、プレスリリース）\n・海外メディア（Bloomberg, The Vergeなど）\n・日本語メディア\n・アナリストレポート`,
                      role: "assistant",
                      timestamp: new Date(Date.now() - 2000),
                    },
                    {
                      id: "refine-user-3",
                      content: "Apple公式と、信頼性の高い海外メディアを中心にしたいです。",
                      role: "user",
                      timestamp: new Date(Date.now() - 1000),
                    },
                  ];
                  
                  setRefinementMessages(initialRefinementMessages);
                  setIsTrackingDetailOpen(true);
                  setCurrentView("chat");
                }}
              />
            </motion.div>
          ) : currentView === "notifications" ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <NotificationSettings
                onBack={() => {
                  setCurrentView("home");
                }}
                chats={chats}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "tracking" ? (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <TrackingPage
                onBack={() => {
                  setCurrentView("home");
                  setTrackingPromptId(null);
                }}
                promptId={trackingPromptId}
                chats={chats}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                theme={theme}
              />
            </motion.div>
          ) : currentView === "trackingList" ? (
            <motion.div
              key="trackingList"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <TrackingListView
                onBack={() => {
                  setCurrentView("home");
                  setTrackingPromptId(null);
                }}
                chats={chats}
                onSelectChat={handleSelectChat}
                onViewNotificationSettings={() => {
                  setCurrentView("notifications");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
                onNewChat={() => {
                  // ホーム画面に戻る
                  setCurrentView("home");
                  setCurrentChatId(null);
                  setTrackingPromptId(null);
                }}
              />
            </motion.div>
          ) : currentView === "planSelection" ? (
            <motion.div
              key="planSelection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PlanSelection
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "planManagement" ? (
            <motion.div
              key="planManagement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <PlanManagement
                onBack={() => {
                  setCurrentView("home");
                }}
                onChangePlan={() => {
                  setCurrentView("planSelection");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "integrations" ? (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <IntegrationScreen
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : currentView === "trackingSettings" ? (
            <motion.div
              key="trackingSettings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TrackingSettingsScreen
                onBack={() => {
                  setCurrentView("home");
                }}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() =>
                  setIsSidebarOpen(!isSidebarOpen)
                }
              />
            </motion.div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Main container - フレックスレイアウトで左右に分割 */}
              <div className="flex-1 flex overflow-hidden">
                {/* Chat Area - トラッキング詳細が開いているときは左側に配置 */}
                <div className={`flex flex-col transition-all duration-300 ${
                  isTrackingDetailOpen ? 'w-[35%]' : 'w-full'
                }`}>
                  {/* トラッキング詳細が開いている場合は専用チャット画面を表示 */}
                  {isTrackingDetailOpen ? (
                    <TrackingRefinementChat 
                      refinementMessages={refinementMessages}
                      onSendMessage={handleRefinementMessage}
                      currentMode={currentMode}
                      onModeChange={setCurrentMode}
                    />
                  ) : isDefaultModeDetailOpen ? (
                    <div className={`flex-1 overflow-y-auto flex flex-col items-center ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                        : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                    }`}>
                      <DefaultModeTrackingDetail
                        query={
                          trackingSuggestions.find((s) => s.accepted)?.query ||
                          "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向教えてください。"
                        }
                        frequency={activeTracking?.frequency || "毎日 9:00"}
                        onExecute={() => {
                          // トラッキング実行：現在のチャットをサイドバーの「追跡中」に追加
                          if (currentChatId) {
                            setChats((prevChats) =>
                              prevChats.map((chat) =>
                                chat.id === currentChatId
                                  ? {
                                      ...chat,
                                      isTracking: true,
                                      trackingActive: true,
                                      trackingFrequency: activeTracking?.frequency || "毎日 9:00",
                                    }
                                  : chat,
                              ),
                            );
                          }
                          console.log("デフォルトモードでトラッキング実行");
                          // 詳細画面を閉じて成功メッセージに戻る
                          setIsDefaultModeDetailOpen(false);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={`flex-1 overflow-y-auto flex flex-col items-center pb-4 ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-[#1a1f2e] via-[#252a3a] to-[#2a1f2e]'
                          : 'bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#fce4ec]'
                      }`}>
                        {currentChat &&
                        currentChat.messages.length > 0 ? (
                          <div className={`w-full mx-auto px-6 py-6 pb-32 transition-all duration-300 ${
                            isTrackingDetailOpen ? 'max-w-full' : 'max-w-3xl'
                          }`}>
                            {(() => {
                              // メッセージを追跡開始前と後に分割
                              const messagesBeforeTracking = activeTracking?.startTime 
                                ? currentChat.messages.filter(msg => msg.timestamp < activeTracking.startTime!)
                                : currentChat.messages;
                              
                              const messagesAfterTracking = activeTracking?.startTime
                                ? currentChat.messages.filter(msg => msg.timestamp >= activeTracking.startTime!)
                                : [];

                              return (
                                <>
                                  {/* 追跡開始前のメッセージ */}
                                  {messagesBeforeTracking.map((message, index) => (
                                    <div key={message.id}>
                                      <ChatMessage message={message} />

                                      {/* アシスタントの回答の後に追跡提案を表示 */}
                                      {message.role === "assistant" &&
                                        index > 0 &&
                                        messagesBeforeTracking[index - 1].role === "user" && (
                                          <>
                                            {/* 該当するユーザーメッセージに対する追跡提案カード */}
                                            {trackingSuggestions.find(
                                              (s) =>
                                                s.messageId ===
                                                  messagesBeforeTracking[index - 1].id && !s.accepted,
                                            ) && (
                                              <>
                                                {/* SimpleTrackingSetup */}
                                                <div className="max-w-4xl mx-auto mt-6 mb-4" ref={trackingSuggestionCardRef}>
                                                  <SimpleTrackingSetup
                                                    userPrompt={
                                                      trackingSuggestions.find(
                                                        (s) =>
                                                          s.messageId ===
                                                          messagesBeforeTracking[index - 1].id,
                                                      )?.query || ""
                                                    }
                                                    recommendedPrompt="「Apple Intelligenceの2024〜2025年における、主要な機能アップデート、日本語対応の進捗状況、対応デバイスの拡大、プライバシー技術の革新、および市場での評価について、信頼性の高いソースから継続的に追跡し、重要な変化があれば通知してください。」"
                                                    onExecuteTracking={() => {
                                                      const trackingStartTime = new Date();
                                                      setActiveTracking({
                                                        theme: "Apple Intelligence",
                                                        frequency: "毎日 9:00",
                                                        startTime: trackingStartTime,
                                                      });
                                                      setTrackingSuggestions(
                                                        (prev) =>
                                                          prev.map((s) =>
                                                            s.messageId === messagesBeforeTracking[index - 1].id
                                                              ? { ...s, accepted: true }
                                                              : s,
                                                          ),
                                                      );
                                                      
                                                      // 現在のチャットをサイドバーの「追跡中」に追加
                                                      if (currentChatId) {
                                                        setChats((prevChats) =>
                                                          prevChats.map((chat) =>
                                                            chat.id === currentChatId
                                                              ? {
                                                                  ...chat,
                                                                  isTracking: true,
                                                                  trackingActive: true,
                                                                  trackingFrequency: "毎日 9:00",
                                                                }
                                                              : chat,
                                                          ),
                                                        );
                                                      }
                                                      
                                                      console.log("追跡実行");
                                                    }}
                                                    onOpenDetailSettings={() => {
                                                      // 詳細設定を開く
                                                      setIsSidebarOpen(false);
                                                      setIsTrackingDetailOpen(true);
                                                    }}
                                                  />
                                                </div>
                                              </>
                                            )}
                                          </>
                                        )}
                                    </div>
                                  ))}

                                  {/* Tracking Status Badge - 追跡開始後に表示 */}
                                  {activeTracking && !isTrackingDetailOpen && !isDefaultModeDetailOpen && (
                                    currentMode === "default" ? (
                                      <TrackingSuccessMessage
                                        theme={activeTracking.theme}
                                        frequency={activeTracking.frequency}
                                        onViewDetails={() => {
                                          // 成功メッセージを非表示にして元のチャット画面に戻る
                                          setActiveTracking(null);
                                          // トラッキング提案カードを再表示
                                          setTrackingSuggestions((prev) =>
                                            prev.map((s) => ({
                                              ...s,
                                              accepted: false,
                                            }))
                                          );
                                          // カードまでスクロール
                                          setTimeout(() => {
                                            trackingSuggestionCardRef.current?.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'start',
                                            });
                                          }, 100);
                                        }}
                                      />
                                    ) : (
                                      <TrackingStatusBadge
                                        ref={trackingStatusBadgeRef}
                                        theme={activeTracking.theme}
                                        frequency={activeTracking.frequency}
                                        onManage={() => {
                                          // トラッキング詳細パネルを開く
                                          setIsTrackingDetailOpen(true);
                                          // メニューバーを閉じる
                                          setIsSidebarOpen(false);
                                        }}
                                      />
                                    )
                                  )}

                                  {/* 追跡開始後の新しいメッセージ */}
                                  {messagesAfterTracking.map((message) => (
                                    <div key={message.id}>
                                      <ChatMessage message={message} />
                                    </div>
                                  ))}
                                </>
                              );
                            })()}
                            
                            {/* スクロール用の参照ポイント */}
                            <div ref={chatMessagesEndRef} />
                          </div>
                        ) : null}
                      </div>

                      {/* Input Area - fixed at bottom when in chat */}
                      {currentChat &&
                        currentChat.messages.length > 0 && (
                          <ChatInput
                            onSendMessage={handleSendMessage}
                            isHome={false}
                            currentMode={currentMode}
                            onModeChange={setCurrentMode}
                          />
                        )}
                    </>
                  )}
                </div>

                {/* Tracking Detail Panel - 右側のボックス */}
                <TrackingDetail
                  isOpen={isTrackingDetailOpen}
                  onClose={() => {
                    setIsTrackingDetailOpen(false);
                    // ブラッシュアップチャット履歴をクリア
                    setRefinementMessages([]);
                  }}
                  theme={activeTracking?.theme || ""}
                  frequency={activeTracking?.frequency || "毎日 9:00"}
                  query={
                    trackingSuggestions.find((s) => s.accepted)?.query ||
                    "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。"
                  }
                  mode={currentMode}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Update Panel - 右側からスライド */}
      <UpdatePanel
        isOpen={isUpdatePanelOpen}
        onClose={() => setIsUpdatePanelOpen(false)}
        chats={chats}
        onSelectChat={handleSelectChat}
        theme={theme}
      />

      {/* Settings Modal - 右側からスライド */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onViewIntegrations={() => {
          setCurrentView("integrations");
          setIsSettingsModalOpen(false);
        }}
        onViewTrackingSettings={() => {
          setCurrentView("trackingSettings");
          setIsSettingsModalOpen(false);
        }}
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}