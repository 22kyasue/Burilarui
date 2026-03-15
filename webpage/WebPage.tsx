import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Sparkles, Zap, Globe, Shield, BarChart3, Search,
  Bell, Clock, Star, Check, Menu, X, MessageSquare, TrendingUp,
  Eye, Brain, ChevronRight, ChevronDown, Play, ArrowUpRight,
  Lock, Cpu, RefreshCw, Layers, Users, Activity, Target,
  FileText, Wifi, Database, Settings, Filter,
} from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
const ease = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════════ */

function Reveal({ children, className = '', delay = 0, y = 40 }: {
  children: ReactNode; className?: string; delay?: number; y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function RevealX({ children, className = '', delay = 0, x = -40 }: {
  children: ReactNode; className?: string; delay?: number; x?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ children, className = '', staggerDelay = 0.1 }: {
  children: ReactNode; className?: string; staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerChild = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};

function Marquee({ children, speed = 30, className = '', reverse = false }: {
  children: ReactNode; speed?: number; className?: string; reverse?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-16 items-center w-max"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/* Animated counter */
function Counter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{prefix}{inView ? count.toLocaleString() : '0'}{suffix}</span>;
}

/* ═══════════════════════════════════════════════
   NAV — todesktop-style morphing navigation
   ═══════════════════════════════════════════════ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: '機能', href: '#features' },
    { label: '使い方', href: '#how-it-works' },
    { label: '活用例', href: '#use-cases' },
    { label: '料金', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
      >
        <nav
          className="flex flex-wrap items-center justify-between w-full transition-all duration-700 ease-out"
          style={{
            maxWidth: scrolled ? 720 : 1200,
            marginTop: scrolled ? 14 : 0,
            padding: scrolled ? '6px 6px 6px 24px' : '20px 40px',
            borderRadius: scrolled ? 9999 : 0,
            background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            boxShadow: scrolled
              ? '0 1px 2px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)'
              : 'none',
            border: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          }}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 transition-transform duration-300 group-hover:scale-110 shadow-md shadow-orange-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-[17px] font-bold tracking-tight transition-colors duration-500"
              style={{ color: scrolled ? '#0a0a0a' : '#ffffff' }}
            >
              Burilar
            </span>
          </a>

          {/* Links + CTAs — always visible, responsive sizing */}
          <div className="flex items-center gap-0.5 flex-wrap">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3.5 py-2 text-[13px] font-medium rounded-full transition-all duration-300"
                style={{ color: scrolled ? '#6b7280' : 'rgba(255,255,255,0.60)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = scrolled ? '#0a0a0a' : '#ffffff';
                  e.currentTarget.style.background = scrolled ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = scrolled ? '#6b7280' : 'rgba(255,255,255,0.60)';
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={APP_URL}
              className="text-[13px] font-medium transition-colors duration-300 px-3 py-2"
              style={{ color: scrolled ? '#6b7280' : 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = scrolled ? '#0a0a0a' : '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = scrolled ? '#6b7280' : 'rgba(255,255,255,0.60)'; }}
            >
              ログイン
            </a>
            <a
              href={APP_URL}
              className="flex items-center gap-2 rounded-full text-[13px] font-semibold transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
              style={{
                padding: scrolled ? '8px 20px' : '10px 24px',
                background: scrolled ? '#0a0a0a' : 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.2)',
                backdropFilter: scrolled ? 'none' : 'blur(8px)',
              }}
            >
              無料で始める
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </nav>
      </motion.header>
    </>
  );
}

/* ═══════════════════════════════════════════════
   HERO — gradient with floating elements + app mockup
   ═══════════════════════════════════════════════ */

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const orbOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      label: 'AI分析',
      icon: Brain,
      desc: 'Perplexity AIがすべてのアップデートを深い文脈理解で分析。単なるデータではなく、実用的なインサイトを提供します。',
    },
    {
      label: 'リアルタイム監視',
      icon: Eye,
      desc: '数千のソースを24時間365日モニタリング。トピックを設定するだけで、Burilarがウェブ全体を見守ります。',
    },
    {
      label: 'スマート通知',
      icon: Bell,
      desc: 'ノイズを排除するインテリジェントなアラート。本当に重要な変化だけを、最適なタイミングでお知らせします。',
    },
    {
      label: 'AIチャット',
      icon: MessageSquare,
      desc: '追跡トピックについてAIに質問できるチャット機能。フォローアップの質問で、インサイトをさらに深掘りできます。',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveTab((t) => (t + 1) % tabs.length), 4000);
    return () => clearInterval(timer);
  }, []);

  /* Typing animation for search placeholder */
  const typingTexts = [
    '最新のAIモデル動向を追跡',
    '競合企業の新製品リリース',
    '暗号資産の規制ニュース',
    'サイバーセキュリティの脅威情報',
  ];
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = typingTexts[typingIndex];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && typingText === current) {
      const pause = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pause);
    }
    if (isDeleting && typingText === '') {
      setIsDeleting(false);
      setTypingIndex((i) => (i + 1) % typingTexts.length);
      return;
    }

    const timer = setTimeout(() => {
      setTypingText(
        isDeleting ? current.substring(0, typingText.length - 1) : current.substring(0, typingText.length + 1)
      );
    }, speed);
    return () => clearTimeout(timer);
  }, [typingText, isDeleting, typingIndex]);

  return (
    <section ref={heroRef} className="relative min-h-screen hero-gradient overflow-hidden noise-overlay">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(252,170,45,0.12) 0%, transparent 70%)', scale: orbScale, opacity: orbOpacity }}
      />
      <motion.div
        className="absolute top-[25%] right-[0%] w-[700px] h-[700px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,82,204,0.1) 0%, transparent 70%)', animationDelay: '2s', scale: orbScale, opacity: orbOpacity }}
      />
      <motion.div
        className="absolute bottom-[25%] left-[25%] w-[500px] h-[500px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.08) 0%, transparent 70%)', animationDelay: '4s', opacity: orbOpacity }}
      />

      {/* Rotating ring decorations */}
      <div className="absolute top-[15%] right-[12%] w-[180px] h-[180px] animate-spin-slow pointer-events-none opacity-15 hidden xl:block">
        <div className="w-full h-full rounded-full border border-white/20" />
        <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
      </div>
      <div className="absolute bottom-[35%] left-[8%] w-[120px] h-[120px] animate-spin-slow pointer-events-none opacity-10 hidden xl:block" style={{ animationDirection: 'reverse', animationDuration: '30s' }}>
        <div className="w-full h-full rounded-full border border-dashed border-white/15" />
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-400" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-36 sm:pt-44 pb-20 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-wide glass-strong text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            AIインテリジェンス搭載
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="text-[clamp(2.2rem,6.5vw,5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white max-w-[900px] font-jp"
        >
          あらゆるトピックを追跡。
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent animate-gradient">
            すべてを把握。
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease }}
          className="mt-7 text-[clamp(0.95rem,1.8vw,1.2rem)] leading-[1.8] text-white/50 max-w-[580px] font-jp"
        >
          Burilarは、あなたが関心を持つトピックをウェブ全体で監視し、
          AIがキュレーションしたアップデートをお届けします。
          <br className="hidden sm:block" />
          重要な情報を、もう見逃しません。
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={APP_URL}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            無料で始める
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href="#how-it-works"
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[15px] font-medium glass text-white/75 hover:text-white hover:bg-white/15 transition-all duration-300"
          >
            <Play className="w-4 h-4" />
            使い方を見る
          </a>
        </motion.div>

        {/* Mini trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease }}
          className="mt-6 flex items-center gap-4 text-[12px] text-white/30"
        >
          <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400/60" /> クレジットカード不要</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/60" /> セキュアなデータ管理</span>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
          <span className="hidden sm:flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-400/60" /> 30秒でセットアップ完了</span>
        </motion.div>

        {/* Auto-cycling feature tabs */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease }}
          className="mt-20 w-full max-w-[700px]"
        >
          <div className="glass-strong rounded-2xl p-1.5 flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className="relative flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[12px] sm:text-[13px] font-medium transition-all duration-300"
                style={{
                  color: activeTab === i ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  background: activeTab === i ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                {activeTab === i && (
                  <motion.div
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full overflow-hidden"
                    layoutId="hero-tab-indicator"
                  >
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-tab-progress" key={activeTab} />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-5 text-[14px] text-white/45 leading-[1.8] font-jp"
            >
              {tabs[activeTab].desc}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Floating app mockup */}
        <motion.div
          style={{ y: mockupY }}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.1, ease }}
          className="mt-16 w-full max-w-[920px]"
        >
          <div className="relative group">
            {/* Glow behind card */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-amber-400/20 via-blue-500/15 to-purple-500/20 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700" />

            {/* Main card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a18]/85 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-white/[0.04] text-[11px] text-white/20 font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    burilar.app
                  </div>
                </div>
                <div className="w-[52px]" />
              </div>

              {/* Mock content */}
              <div className="p-5 sm:p-8">
                {/* Search bar with typing animation */}
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06] transition-colors hover:bg-white/[0.05]">
                  <Search className="w-5 h-5 text-white/25 shrink-0" />
                  <span className="text-[14px] sm:text-[15px] text-white/35 font-jp truncate">
                    {typingText}
                    <span className="animate-cursor text-amber-400/80 ml-0.5">|</span>
                  </span>
                  <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] text-[11px] text-white/20 font-mono shrink-0">
                    ⌘K
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { text: '最新のAIモデル', icon: Brain },
                    { text: 'ビジネストレンド', icon: TrendingUp },
                    { text: 'マーケティング戦略', icon: Target },
                    { text: 'テクノロジー最前線', icon: Cpu },
                  ].map((chip) => (
                    <span key={chip.text} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[12px] text-white/35 hover:text-white/55 hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-200 cursor-pointer">
                      <chip.icon className="w-3 h-3" />
                      {chip.text}
                    </span>
                  ))}
                </div>

                {/* Mock tracking items */}
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-[11px] uppercase tracking-wider text-white/20 font-medium">追跡中のトピック</span>
                  </div>
                  {[
                    { title: 'GPT-5の開発動向', updates: 12, time: '2分前', color: '#22c55e', badge: '重要' },
                    { title: 'ビットコインETFニュース', updates: 8, time: '15分前', color: '#3b82f6', badge: '速報' },
                    { title: 'React 20リリース情報', updates: 3, time: '1時間前', color: '#a855f7', badge: '技術' },
                    { title: 'EU AI規制法の施行状況', updates: 5, time: '3時間前', color: '#f59e0b', badge: '規制' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + i * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.025] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200 group/item cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0 shadow-lg" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
                        <span className="text-[13px] text-white/65 font-medium truncate group-hover/item:text-white/80 transition-colors">{item.title}</span>
                        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ color: `${item.color}cc`, background: `${item.color}15` }}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-[11px] text-white/25 font-mono hidden sm:block">{item.updates}件 · {item.time}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover/item:text-white/30 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
    </section>
  );
}

/* ═══════════════════════════════════════════════
   STATS — animated counters
   ═══════════════════════════════════════════════ */

function Stats() {
  const stats = [
    { value: 50000, suffix: '+', label: 'ソースを常時監視', icon: Globe },
    { value: 99.9, suffix: '%', label: 'の稼働率を維持', icon: Activity },
    { value: 500, suffix: 'ms', label: '以下の通知速度', icon: Zap },
    { value: 10000, suffix: '+', label: 'のアクティブトラッキング', icon: Target },
  ];

  return (
    <section className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
          {stats.map((s) => (
            <motion.div key={s.label} variants={staggerChild} className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-50 group-hover:scale-110 transition-all duration-300">
                <s.icon className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors duration-300" />
              </div>
              <div className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight text-gray-900 mb-1">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="text-[13px] text-gray-400 font-medium font-jp">{s.label}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   LOGO CLOUD — trust marquee (double-row)
   ═══════════════════════════════════════════════ */

function LogoCloud() {
  const row1 = ['市場調査', '競合分析', 'テクノロジートレンド', 'AI・機械学習', '暗号資産・DeFi', 'スタートアップ動向'];
  const row2 = '製品リリース 規制・コンプライアンス セキュリティ脅威 業界レポート M&A動向 特許情報'.split(' ').reduce<string[]>((acc, word, i, arr) => {
    if (i % 2 === 0 && i + 1 < arr.length) acc.push(`${word} ${arr[i + 1]}`);
    else if (i % 2 === 0) acc.push(word);
    return acc;
  }, []);
  const row2Items = ['製品リリース', '規制・コンプライアンス', 'セキュリティ脅威', '業界レポート', 'M&A動向', '特許・知財情報'];

  return (
    <section className="py-14 bg-white overflow-hidden">
      <Reveal className="text-center mb-8">
        <p className="text-[12px] font-semibold text-gray-300 uppercase tracking-[0.2em] font-jp">
          あらゆる分野の情報収集を自動化
        </p>
      </Reveal>
      <Marquee speed={40} className="mb-4">
        {row1.map((item) => (
          <span key={item} className="flex items-center gap-2.5 text-[14px] font-semibold text-gray-200 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            {item}
          </span>
        ))}
      </Marquee>
      <Marquee speed={45} reverse>
        {row2Items.map((item) => (
          <span key={item} className="flex items-center gap-2.5 text-[14px] font-semibold text-gray-200 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FEATURES — 6 cards in 3x2 grid with mini demos
   ═══════════════════════════════════════════════ */

const features = [
  {
    icon: Brain,
    title: 'AI分析エンジン',
    desc: 'Perplexity AIがすべてのアップデートを文脈を踏まえて分析。単なるデータ収集ではなく、「何が重要で、なぜ重要か」を解説します。',
    color: '#8b5cf6',
    gradient: 'from-violet-500/10 to-purple-500/5',
    detail: 'GPT-4o, Claude, Geminiなど複数のAIモデルを活用',
  },
  {
    icon: Eye,
    title: 'リアルタイム監視',
    desc: '数千のニュースソース、ブログ、SNS、論文、政府機関の発表を24時間365日モニタリング。重要な変化を即座にキャッチします。',
    color: '#3b82f6',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    detail: '50,000以上のソースをリアルタイムでスキャン',
  },
  {
    icon: Bell,
    title: 'スマート通知',
    desc: 'ノイズを排除するインテリジェントなフィルタリング。重要度に応じた通知設定で、本当に必要な情報だけをお届けします。',
    color: '#f59e0b',
    gradient: 'from-amber-500/10 to-orange-500/5',
    detail: 'メール・プッシュ・アプリ内通知に対応',
  },
  {
    icon: MessageSquare,
    title: 'AIチャット',
    desc: '追跡トピックについて自然な対話でAIに質問。フォローアップ質問で深掘りし、レポート生成まで一気通貫で対応します。',
    color: '#10b981',
    gradient: 'from-emerald-500/10 to-green-500/5',
    detail: '日本語での自然な対話をサポート',
  },
  {
    icon: BarChart3,
    title: 'トレンド分析',
    desc: '時系列でのトレンド変化を可視化。過去のアップデートとの比較分析で、トレンドの方向性を把握できます。',
    color: '#ec4899',
    gradient: 'from-pink-500/10 to-rose-500/5',
    detail: 'ダッシュボードで直感的に把握',
  },
  {
    icon: Shield,
    title: 'セキュリティ & プライバシー',
    desc: 'エンドツーエンドの暗号化、SOC 2準拠のインフラ。追跡データは厳重に保護され、第三者と共有されることはありません。',
    color: '#6366f1',
    gradient: 'from-indigo-500/10 to-blue-500/5',
    detail: 'エンタープライズグレードのセキュリティ',
  },
];

function Features() {
  return (
    <section id="features" className="py-28 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-amber-700 bg-amber-50 font-jp">
            機能
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            先を行くために必要な、
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              すべてがここに
            </span>
          </h2>
          <p className="mt-5 text-[16px] text-gray-500 max-w-[520px] mx-auto leading-[1.8] font-jp">
            ウェブ上の情報を追跡・分析・活用する方法を根本から変える、パワフルなツールを提供します。
          </p>
        </Reveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerChild}
              className={`group relative p-7 rounded-2xl border border-gray-100 bg-gradient-to-br ${f.gradient} hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1.5 transition-all duration-500 cursor-default`}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: `${f.color}12`, color: f.color, boxShadow: `0 0 0 0 ${f.color}00` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 20px ${f.color}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0 0 ${f.color}00`; }}
              >
                <f.icon className="w-5 h-5" />
              </div>

              <h3 className="text-[18px] font-bold text-gray-900 mb-2.5 font-jp">{f.title}</h3>
              <p className="text-[14px] text-gray-500 leading-[1.8] mb-4 font-jp">{f.desc}</p>

              {/* Detail tag */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md font-jp">
                <Check className="w-3 h-3" style={{ color: f.color }} />
                {f.detail}
              </span>

              {/* Hover arrow */}
              <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight className="w-4.5 h-4.5 text-gray-300" />
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   HOW IT WORKS — 3 detailed steps
   ═══════════════════════════════════════════════ */

const steps = [
  {
    num: '01',
    icon: Search,
    title: 'トラッキングを作成',
    desc: '監視したいトピックをBurilarに伝えてください。企業名、テクノロジー、市場トレンド、キーワード — あらゆるテーマに対応します。',
    detail: '自然言語で入力するだけ。「OpenAIの新モデルリリース」のように、普段の言葉で設定できます。',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'AIがウェブを監視',
    desc: 'Burilarが数千のソースを継続的にスキャンし、リアルタイムでノイズからシグナルを選別します。',
    detail: 'ニュース、SNS、ブログ、学術論文、政府機関の発表など、幅広いソースから情報を収集。',
  },
  {
    num: '03',
    icon: BarChart3,
    title: '厳選されたインサイトを取得',
    desc: 'AIが分析したアップデートを、文脈・要約・重要度スコアとともにお届け。次のアクションが明確になります。',
    detail: 'チャットでフォローアップ質問も可能。さらに深い分析が必要な時は、AIに直接聞けます。',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-gray-50/60">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-20">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-blue-700 bg-blue-50 font-jp">
            使い方
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            シンプルに始めて、
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              パワフルに活用
            </span>
          </h2>
          <p className="mt-4 text-[16px] text-gray-500 max-w-[460px] mx-auto leading-[1.8] font-jp">
            3つのステップで、情報収集を自動化できます。
          </p>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-8 lg:gap-12 relative" staggerDelay={0.15}>
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[56px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-[2px] z-0">
            <div className="w-full h-full bg-gradient-to-r from-amber-200 via-blue-200 to-purple-200 rounded-full" />
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
              <line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(252,170,45,0.4)" strokeWidth="2" strokeDasharray="6 4" style={{ animation: 'dash-flow 1.5s linear infinite' }} />
            </svg>
          </div>

          {steps.map((s, i) => (
            <motion.div key={s.num} variants={staggerChild} className="relative text-center z-10">
              {/* Step number circle */}
              <div className="relative mx-auto mb-8">
                <div className="w-[80px] h-[80px] rounded-2xl bg-white shadow-lg shadow-gray-200/60 border border-gray-100 flex items-center justify-center mx-auto hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <s.icon className="w-7 h-7 text-gray-700" />
                </div>
                <span className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[12px] font-bold flex items-center justify-center shadow-lg shadow-orange-400/30">
                  {s.num}
                </span>
              </div>

              <h3 className="text-[19px] font-bold text-gray-900 mb-3 font-jp">{s.title}</h3>
              <p className="text-[14px] text-gray-500 leading-[1.8] max-w-[320px] mx-auto mb-4 font-jp">{s.desc}</p>
              <p className="text-[12px] text-gray-400 leading-[1.7] max-w-[280px] mx-auto bg-gray-100/60 rounded-lg px-4 py-3 font-jp">{s.detail}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   SHOWCASE — large parallax app display
   ═══════════════════════════════════════════════ */

function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotate = useTransform(scrollYProgress, [0, 1], [2, -2]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.98]);

  return (
    <section ref={ref} className="py-28 bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            インサイトを、指先に
          </h2>
          <p className="mt-4 text-[16px] text-gray-500 max-w-[480px] mx-auto leading-[1.8] font-jp">
            ノイズを排除し、本質的な情報だけを浮かび上がらせる、
            美しいインターフェース。
          </p>
        </Reveal>

        <Reveal>
          <motion.div style={{ y, rotateZ: rotate, scale }} className="relative max-w-[980px] mx-auto">
            {/* Glow */}
            <div className="absolute -inset-10 rounded-3xl bg-gradient-to-r from-amber-400/15 via-blue-500/10 to-purple-500/15 blur-3xl" />

            {/* Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#0c0c18] to-[#0a0a14] border border-gray-800/50 shadow-2xl shadow-black/30 overflow-hidden">
              {/* Window bar */}
              <div className="flex items-center px-5 py-3 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-4">
                  {['追跡中', '会話', '通知設定'].map((tab, i) => (
                    <span key={tab} className={`text-[11px] font-medium px-3 py-1 rounded-md transition-colors ${i === 0 ? 'bg-white/[0.06] text-white/60' : 'text-white/25 hover:text-white/40'}`}>{tab}</span>
                  ))}
                </div>
                <Settings className="w-3.5 h-3.5 text-white/15" />
              </div>

              {/* Three-panel mockup */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                {/* Left sidebar */}
                <div className="md:col-span-3 p-5 border-r border-white/[0.04]">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] mb-4">
                    <Search className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-[11px] text-white/20 font-jp">検索</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/15 font-medium mb-3 px-1 font-jp">追跡中</div>
                  {[
                    { name: 'AI・機械学習', active: true, count: 12 },
                    { name: 'フィンテック規制', active: false, count: 5 },
                    { name: 'クリーンテック', active: false, count: 3 },
                    { name: 'サイバーセキュリティ', active: false, count: 8 },
                  ].map((t) => (
                    <div key={t.name} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium mb-1 transition-colors ${t.active ? 'bg-white/[0.05] text-white/70' : 'text-white/30 hover:text-white/45 hover:bg-white/[0.02]'}`}>
                      <span className="truncate font-jp">{t.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${t.active ? 'bg-amber-400/15 text-amber-400/80' : 'text-white/15'}`}>{t.count}</span>
                    </div>
                  ))}
                  <div className="text-[10px] uppercase tracking-wider text-white/15 font-medium mb-3 mt-5 px-1 font-jp">会話</div>
                  {['GPT-5の詳細分析', 'EU規制の影響'].map((c) => (
                    <div key={c} className="px-3 py-2 rounded-lg text-[12px] text-white/25 hover:text-white/40 hover:bg-white/[0.02] transition-colors mb-1 truncate font-jp">{c}</div>
                  ))}
                </div>

                {/* Main content */}
                <div className="md:col-span-6 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                      <Brain className="w-4.5 h-4.5 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-white/80 font-jp">AI・機械学習</div>
                      <div className="text-[11px] text-white/25 font-jp">本日12件のアップデート</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-white/15" />
                      <RefreshCw className="w-3.5 h-3.5 text-white/15" />
                    </div>
                  </div>
                  {[
                    { title: 'OpenAIが新型推論モデルを発表', time: '2時間前', badge: '重要', badgeColor: '#ef4444' },
                    { title: 'EU AI規制法の施行スケジュール更新', time: '4時間前', badge: '規制', badgeColor: '#f59e0b' },
                    { title: 'Google DeepMindのマルチモーダルエージェント論文', time: '6時間前', badge: '研究', badgeColor: '#3b82f6' },
                    { title: 'Anthropic Claude 4.6モデルの性能評価', time: '8時間前', badge: '技術', badgeColor: '#8b5cf6' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] mb-2.5 hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200 cursor-pointer group/update">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0 shadow-sm shadow-amber-400/50" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-white/65 group-hover/update:text-white/80 transition-colors font-jp">{item.title}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: `${item.badgeColor}cc`, background: `${item.badgeColor}15` }}>{item.badge}</span>
                          <span className="text-[10px] text-white/20 font-jp">{item.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/10 mt-1 group-hover/update:text-white/25 transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Right detail panel */}
                <div className="md:col-span-3 p-5 border-l border-white/[0.04] hidden md:block">
                  <div className="text-[10px] uppercase tracking-wider text-white/15 font-medium mb-4 font-jp">AI要約</div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                      <div className="text-[11px] text-white/50 leading-[1.7] font-jp">
                        OpenAIの新モデルは推論能力が大幅に向上。特に複雑な数学的問題とコーディングタスクでの性能改善が顕著です。
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/15 font-medium mt-5 mb-3 font-jp">重要度</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                      </div>
                      <span className="text-[11px] font-bold text-amber-400/80">85</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/15 font-medium mt-5 mb-3 font-jp">関連ソース</div>
                    {['techcrunch.com', 'arxiv.org', 'reuters.com'].map((s) => (
                      <div key={s} className="flex items-center gap-2 py-1.5">
                        <Wifi className="w-3 h-3 text-white/15" />
                        <span className="text-[11px] text-white/25 font-mono">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   USE CASES — who benefits
   ═══════════════════════════════════════════════ */

const useCases = [
  {
    icon: TrendingUp,
    role: 'リサーチャー・アナリスト',
    title: '市場調査を自動化',
    desc: '業界動向、競合の動き、市場トレンドを自動追跡。リサーチ時間を80%削減し、分析に集中できます。',
    color: '#3b82f6',
  },
  {
    icon: Target,
    role: 'プロダクトマネージャー',
    title: '競合インテリジェンス',
    desc: '競合製品のアップデート、価格変更、新機能リリースを即座にキャッチ。常に一歩先の意思決定を。',
    color: '#8b5cf6',
  },
  {
    icon: Shield,
    role: 'セキュリティチーム',
    title: '脅威インテリジェンス',
    desc: '脆弱性情報、攻撃手法、セキュリティパッチのリリースを自動監視。インシデント対応を迅速化します。',
    color: '#ef4444',
  },
  {
    icon: FileText,
    role: 'コンプライアンス担当',
    title: '規制動向のモニタリング',
    desc: '国内外の法規制の変更、ガイドラインの更新を自動追跡。コンプライアンスリスクを未然に防ぎます。',
    color: '#f59e0b',
  },
  {
    icon: Users,
    role: '経営企画・戦略部門',
    title: '戦略的意思決定の支援',
    desc: 'M&A、パートナーシップ、市場参入の機会をいち早くキャッチ。データに基づいた意思決定を支援します。',
    color: '#10b981',
  },
  {
    icon: Layers,
    role: '投資家・VCファンド',
    title: '投資機会の発見',
    desc: 'スタートアップの資金調達、IPO情報、セクター別トレンドを自動監視。投資判断の精度を向上させます。',
    color: '#ec4899',
  },
];

function UseCases() {
  return (
    <section id="use-cases" className="py-28 bg-gray-50/60">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-purple-700 bg-purple-50 font-jp">
            活用例
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            あらゆるチームの情報収集を、
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              根本から変える
            </span>
          </h2>
        </Reveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {useCases.map((uc) => (
            <motion.div
              key={uc.title}
              variants={staggerChild}
              className="group p-7 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${uc.color}10`, color: uc.color }}>
                  <uc.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider font-jp" style={{ color: uc.color }}>{uc.role}</span>
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2.5 font-jp">{uc.title}</h3>
              <p className="text-[14px] text-gray-500 leading-[1.8] font-jp">{uc.desc}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS — detailed reviews
   ═══════════════════════════════════════════════ */

const testimonials = [
  {
    quote: 'Burilarを導入してから、競合の動きを数日前にキャッチできるようになりました。チーム全体の情報感度が格段に上がっています。',
    name: '田中 悠希',
    role: '戦略企画部長・TechCorp',
    avatar: '田',
    color: '#8b5cf6',
  },
  {
    quote: 'AI分析の質が驚くほど高い。ただ情報を集めるだけでなく、「なぜ重要か」「次に何をすべきか」まで教えてくれます。',
    name: '佐藤 真理',
    role: 'プロダクトマネージャー・ScaleUp',
    avatar: '佐',
    color: '#3b82f6',
  },
  {
    quote: '毎日2時間かけていたニュースチェックが、Burilarで数秒に。しかも、自分では見つけられなかった情報まで拾ってくれます。',
    name: '鈴木 健太',
    role: 'リサーチアナリスト・Horizon Fund',
    avatar: '鈴',
    color: '#10b981',
  },
  {
    quote: 'セキュリティ脅威の監視に活用しています。脆弱性情報をリアルタイムでキャッチでき、インシデント対応が劇的に早くなりました。',
    name: '高橋 美咲',
    role: 'CISO・FinSecure',
    avatar: '高',
    color: '#ef4444',
  },
];

function Testimonials() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-emerald-700 bg-emerald-50 font-jp">
            ユーザーの声
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            プロフェッショナルに
            <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              選ばれる理由
            </span>
          </h2>
        </Reveal>

        <StaggerContainer className="grid sm:grid-cols-2 gap-6" staggerDelay={0.1}>
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={staggerChild}
              className="group p-7 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-[15px] text-gray-600 leading-[1.9] mb-8 font-jp">「{t.quote}」</p>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-white shadow-md"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-gray-900 font-jp">{t.name}</div>
                  <div className="text-[12px] text-gray-400 font-jp">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════ */

const faqs = [
  {
    q: 'Burilarはどのような情報源を監視していますか？',
    a: 'ニュースサイト、テックブログ、学術論文データベース、政府機関の発表、SNS、プレスリリース配信サービスなど、50,000以上のソースをリアルタイムでスキャンしています。ソースは継続的に追加・更新されています。',
  },
  {
    q: 'AIの分析はどの程度正確ですか？',
    a: 'Perplexity AIをベースに、複数のAIモデルを組み合わせて分析しています。ファクトチェック機能を内蔵しており、情報の信頼性スコアも併せて提供します。ただし、最終的な判断はユーザーご自身にお願いしています。',
  },
  {
    q: '日本語のトピックにも対応していますか？',
    a: 'はい、日本語に完全対応しています。日本語のソースからの情報収集、日本語でのAI分析・要約、日本語でのチャット対話がすべて可能です。英語ソースの情報を日本語で要約することもできます。',
  },
  {
    q: '無料プランにはどのような制限がありますか？',
    a: '無料プランでは、3件のアクティブトラッキング、日次ダイジェスト更新、基本的なAI要約機能、7日間の履歴保持が利用できます。本格的な監視には、リアルタイム更新やAIチャットが使えるProプランをおすすめします。',
  },
  {
    q: 'データのセキュリティはどのように保護されていますか？',
    a: 'エンドツーエンド暗号化、SOC 2準拠のインフラ、定期的なセキュリティ監査を実施しています。お客様のデータは厳重に保護され、第三者と共有されることはありません。エンタープライズプランではSSO/SAMLにも対応しています。',
  },
  {
    q: '既存のワークフローと連携できますか？',
    a: 'はい、Proプラン以上ではメール通知、プッシュ通知、アプリ内通知に対応しています。エンタープライズプランではAPIアクセスが利用でき、Slack、Teams、その他のツールとの連携が可能です。',
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 bg-gray-50/60">
      <div className="max-w-[800px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-gray-600 bg-gray-100 font-jp">
            よくある質問
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            FAQ
          </h2>
        </Reveal>

        <StaggerContainer className="space-y-3" staggerDelay={0.06}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={staggerChild}
              className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:border-gray-200 transition-colors duration-300"
            >
              <button
                className="w-full flex items-start gap-4 p-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="text-[15px] font-semibold text-gray-900 flex-1 leading-[1.6] font-jp">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-1 shrink-0"
                >
                  <ChevronDown className="w-4.5 h-4.5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-[14px] text-gray-500 leading-[1.9] font-jp">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   PRICING — 3 tiers with detailed comparison
   ═══════════════════════════════════════════════ */

const plans = [
  {
    name: 'Free',
    nameJp: 'フリー',
    price: '¥0',
    period: '',
    desc: '基本的なトラッキングで始める',
    features: [
      '3件のアクティブトラッキング',
      '日次ダイジェスト更新',
      '基本的なAI要約',
      '7日間の履歴保持',
      'メール通知',
    ],
    cta: '無料で始める',
    popular: false,
  },
  {
    name: 'Pro',
    nameJp: 'プロ',
    price: '¥2,980',
    period: '/月',
    desc: '本格的なモニタリングに必要なすべて',
    features: [
      '無制限のトラッキング',
      'リアルタイム更新',
      '高度なAI分析・チャット',
      '無制限の履歴保持',
      'カスタムアラートルール',
      '優先サポート',
      'トレンド分析ダッシュボード',
    ],
    cta: 'プロを始める',
    popular: true,
  },
  {
    name: 'Enterprise',
    nameJp: 'エンタープライズ',
    price: 'お問い合わせ',
    period: '',
    desc: '高度な要件を持つチーム向け',
    features: [
      'Proのすべての機能',
      'チームコラボレーション',
      'API アクセス',
      'カスタムインテグレーション',
      '専任サポート担当',
      'SSO & SAML対応',
      'SLA保証・カスタムSLA',
    ],
    cta: '営業に相談する',
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-5 px-4 py-1.5 rounded-full text-violet-700 bg-violet-50 font-jp">
            料金プラン
          </span>
          <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-gray-900 font-jp">
            シンプルで透明な料金体系
          </h2>
          <p className="mt-5 text-[16px] text-gray-500 max-w-[460px] mx-auto leading-[1.8] font-jp">
            無料で始めて、必要に応じてスケール。
            隠れた費用は一切なし、いつでもキャンセル可能。
          </p>
        </Reveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-[1040px] mx-auto" staggerDelay={0.12}>
          {plans.map((p) => (
            <motion.div
              key={p.name}
              variants={staggerChild}
              className={`relative group p-8 rounded-2xl border transition-all duration-500 hover:-translate-y-1.5 ${
                p.popular
                  ? 'bg-gray-900 border-gray-800 text-white shadow-2xl shadow-gray-900/30 md:scale-[1.04]'
                  : 'bg-white border-gray-100 text-gray-900 hover:shadow-xl hover:shadow-gray-100/80'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-400/30 font-jp">
                  一番人気
                </span>
              )}

              <div className="mb-7">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className={`text-[14px] font-semibold ${p.popular ? 'text-white/60' : 'text-gray-400'}`}>
                    {p.name}
                  </h3>
                  <span className={`text-[12px] font-jp ${p.popular ? 'text-white/40' : 'text-gray-300'}`}>
                    {p.nameJp}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-[40px] font-extrabold tracking-tight font-jp ${p.popular ? 'text-white' : 'text-gray-900'}`}>
                    {p.price}
                  </span>
                  {p.period && (
                    <span className={`text-[14px] font-jp ${p.popular ? 'text-white/35' : 'text-gray-400'}`}>{p.period}</span>
                  )}
                </div>
                <p className={`mt-2 text-[13px] font-jp ${p.popular ? 'text-white/45' : 'text-gray-400'}`}>
                  {p.desc}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.popular ? 'text-amber-400' : 'text-emerald-500'}`} />
                    <span className={`text-[13px] leading-[1.6] font-jp ${p.popular ? 'text-white/65' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={APP_URL}
                className={`block w-full py-3.5 rounded-xl text-center text-[14px] font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-jp ${
                  p.popular
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Extra assurance */}
        <Reveal className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] text-gray-400 font-jp">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> SSL暗号化通信</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> SOC 2準拠</span>
            <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> いつでもキャンセル可能</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 14日間の返金保証</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section className="py-32 bg-gray-950 relative overflow-hidden noise-overlay">
      {/* Background elements */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[700px] mx-auto px-6 text-center">
        <Reveal>
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-[clamp(1.8rem,5vw,3.2rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white font-jp">
            重要な情報を、もう見逃さない
          </h2>
          <p className="mt-6 text-[16px] text-gray-400 leading-[1.8] max-w-[460px] mx-auto font-jp">
            情報の最前線に立つプロフェッショナルに選ばれています。
            <br />
            無料で始めて、違いを実感してください。
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={APP_URL}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 font-jp"
            >
              無料で始める
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={APP_URL}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-medium text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600 transition-all duration-300 font-jp"
            >
              ログイン
            </a>
          </div>

          <p className="mt-6 text-[12px] text-gray-600 font-jp">
            クレジットカード不要 · 30秒でセットアップ完了 · いつでもキャンセル可能
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════ */

function Footer() {
  const groups = [
    {
      title: 'プロダクト',
      links: [
        { label: '機能', href: '#features' },
        { label: '料金プラン', href: '#pricing' },
        { label: '使い方', href: '#how-it-works' },
        { label: '活用例', href: '#use-cases' },
        { label: '変更履歴', href: '#' },
      ],
    },
    {
      title: '会社情報',
      links: [
        { label: '会社概要', href: '#' },
        { label: 'ブログ', href: '#' },
        { label: '採用情報', href: '#' },
        { label: 'お問い合わせ', href: '#' },
      ],
    },
    {
      title: '法的情報',
      links: [
        { label: 'プライバシーポリシー', href: '#' },
        { label: '利用規約', href: '#' },
        { label: 'セキュリティ', href: '#' },
        { label: '特定商取引法に基づく表記', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-950 border-t border-gray-900 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-orange-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-[17px] font-bold tracking-tight text-white">Burilar</span>
            </a>
            <p className="text-[13px] text-gray-500 leading-[1.8] max-w-[260px] font-jp">
              AIが駆動するウェブモニタリングで、
              常に情報の最前線に。
            </p>
            <div className="flex items-center gap-3 mt-5">
              {['Twitter', 'GitHub', 'Discord'].map((s) => (
                <a key={s} href="#" className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] text-gray-500 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-4 font-jp">{g.title}</h4>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13px] text-gray-500 hover:text-white transition-colors duration-200 font-jp">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-900 gap-4">
          <p className="text-[12px] text-gray-600 font-jp">&copy; {new Date().getFullYear()} Burilar. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-700 flex items-center gap-1.5 font-jp">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              全システム正常稼働中
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function WebPage() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Inter', 'Noto Sans JP', system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      <Stats />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Showcase />
      <UseCases />
      <Testimonials />
      <FAQ />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
