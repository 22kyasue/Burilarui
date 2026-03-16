import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

/* ─── Canvas: orbs + mouse interaction ─── */
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    // Orbs
    const colors = [
      [30, 58, 138],    // navy
      [37, 99, 235],    // blue
      [59, 130, 246],   // blue-light
      [245, 158, 11],   // amber
      [249, 115, 22],   // orange
      [251, 191, 36],   // amber-light
    ];

    const orbs = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: Math.random() * 100 + 50,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.01 + 0.005,
    }));

    // Floating circle rings
    const rings = Array.from({ length: 8 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 80 + 30,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      thickness: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      rot: 0,
    }));

    // Small particles
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw orbs (big blurred circles)
      orbs.forEach((o) => {
        o.x += o.vx;
        o.y += o.vy;
        o.phase += o.speed;

        // Mouse interaction — gentle attraction
        const dx = mx - o.x;
        const dy = my - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 0) {
          o.x += (dx / dist) * 0.5;
          o.y += (dy / dist) * 0.5;
        }

        // Bounce
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;

        const pulse = 1 + Math.sin(o.phase) * 0.25;
        const cr = o.r * pulse;
        const alpha = 0.18 + Math.sin(o.phase) * 0.08;

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, cr);
        grad.addColorStop(0, `rgba(${o.color[0]},${o.color[1]},${o.color[2]},${alpha})`);
        grad.addColorStop(0.6, `rgba(${o.color[0]},${o.color[1]},${o.color[2]},${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${o.color[0]},${o.color[1]},${o.color[2]},0)`);

        ctx.beginPath();
        ctx.arc(o.x, o.y, cr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Draw floating rings
      rings.forEach((ring) => {
        ring.x += ring.vx;
        ring.y += ring.vy;
        ring.rot += ring.rotSpeed;
        ring.phase += 0.01;

        // Mouse repulsion
        const dx = ring.x - mx;
        const dy = ring.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          ring.x += (dx / dist) * 1.5;
          ring.y += (dy / dist) * 1.5;
        }

        // Wrap
        if (ring.x < -ring.r * 2) ring.x = w + ring.r * 2;
        if (ring.x > w + ring.r * 2) ring.x = -ring.r * 2;
        if (ring.y < -ring.r * 2) ring.y = h + ring.r * 2;
        if (ring.y > h + ring.r * 2) ring.y = -ring.r * 2;

        const alpha = 0.25 + Math.sin(ring.phase) * 0.15;

        ctx.save();
        ctx.translate(ring.x, ring.y);
        ctx.rotate(ring.rot);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},${alpha})`;
        ctx.lineWidth = ring.thickness;
        ctx.stroke();

        // Inner dashed ring
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.arc(0, 0, ring.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ring.color[0]},${ring.color[1]},${ring.color[2]},${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          p.x += (dx / dist) * 0.8;
          p.y += (dy / dist) * 0.8;
        }

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
        ctx.fill();
      });

      // Lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(37,99,235,${(1 - dist / 120) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}

/* ─── Main component ─── */
export default function LoginModal() {
  const { login, register, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in on mount (coming from webpage)
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in';
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      // On success, fade out the login before app renders
      if (containerRef.current) {
        containerRef.current.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        containerRef.current.style.opacity = '0';
        containerRef.current.style.transform = 'scale(1.02)';
      }
    } catch {
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-2xl text-sm backdrop-blur-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-300 border ${
      focusedField === field
        ? 'bg-white/90 dark:bg-gray-800/90 border-amber-400/50 dark:border-amber-500/50 shadow-lg shadow-amber-500/10'
        : 'bg-white/50 dark:bg-gray-800/50 border-white/60 dark:border-gray-700/60 hover:bg-white/70 dark:hover:bg-gray-800/70'
    }`;

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-[#f0f0f8] dark:bg-gray-950" style={{ fontFamily: "'Inter', 'Noto Sans JP', system-ui, sans-serif" }}>
      {/* Animated background */}
      <AnimatedBackground />

      {/* Subtle grid */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-30 dark:opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[52%] flex-col justify-center items-center px-16">
          <div
            className="max-w-lg transition-all duration-1000"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            {/* Logo */}
            <div className="relative mb-10">
              <div className="absolute -inset-3 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-3xl blur-2xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                <span className="text-white text-3xl font-bold">B</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold leading-[1.15] mb-6">
              <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
                あらゆるトピックを
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">追跡。把握。</span>
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-12">
              AIがウェブ全体を監視し、あなたが本当に必要な情報だけを
              キュレーションしてお届けします。
            </p>

            {/* Interactive stat cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10K+', label: 'ソース監視', emoji: '🌐' },
                { value: '99.9%', label: '稼働率', emoji: '⚡' },
                { value: '<1s', label: '通知速度', emoji: '🔔' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="group relative p-5 rounded-2xl cursor-default overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.45)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 8px 32px rgba(37,99,235,0.06)',
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex flex-col items-start gap-2">
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">{s.emoji}</div>
                    <div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent leading-tight">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div
            className="w-full max-w-md transition-all duration-700"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
              transitionDelay: '200ms',
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="relative inline-block mb-4">
                <div className="absolute -inset-2 bg-gradient-to-br from-amber-400/25 to-orange-500/25 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30 mx-auto">
                  <span className="text-white text-2xl font-bold">B</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Burilar
              </h1>
            </div>

            {/* Form — no card, floats on background */}
            <div className="relative">
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isRegister ? 'アカウント作成' : 'おかえりなさい'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {isRegister ? 'Burilarを始めましょう' : 'アカウントにサインインしてください'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {isRegister && (
                    <div className="transition-all duration-300">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'name' ? 'text-amber-500' : 'text-gray-400'}`} />
                        名前
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="あなたの名前"
                        required
                        className={inputClass('name')}
                      />
                    </div>
                  )}

                  <div className="transition-all duration-300">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-amber-500' : 'text-gray-400'}`} />
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com"
                      required
                      className={inputClass('email')}
                    />
                  </div>

                  <div className="transition-all duration-300">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Lock className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-amber-500' : 'text-gray-400'}`} />
                      パスワード
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        required
                        className={inputClass('password').replace('pr-4', 'pr-11')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      className="rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 p-3.5 text-sm text-red-700 dark:text-red-300"
                      style={{ animation: 'shake 0.5s ease-in-out' }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-[15px] font-semibold text-white overflow-hidden shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #f97316)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10 flex items-center gap-2.5">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {isRegister ? 'アカウント作成' : 'サインイン'}
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 mt-8 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                  <span className="text-xs text-gray-400">または</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                </div>

                {/* Toggle */}
                <div className="text-center pb-2">
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    onClick={() => { setIsRegister(!isRegister); clearError(); }}
                  >
                    {isRegister ? 'すでにアカウントをお持ちですか？ ' : 'アカウントをお持ちでないですか？ '}
                    <span className="font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {isRegister ? 'サインイン' : '新規登録'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
