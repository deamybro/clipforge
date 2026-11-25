'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Link as LinkIcon,
  ArrowRight,
  Play,
  Star,
  Scissors,
  Music,
  Crop,
  Target,
  Download,
} from 'lucide-react';

const FEATURES = [
  {
    icon: LinkIcon,
    title: 'Paste Any Link',
    description: 'YouTube, TikTok, Instagram, X, or Facebook. We handle the download automatically.',
  },
  {
    icon: Scissors,
    title: 'Hook-First Clipping',
    description: 'AI starts clips at the strongest spoken hook so viewers get the point immediately.',
  },
  {
    icon: Music,
    title: 'Background Music Library',
    description: 'Choose a background track. ClipForge mixes it under the voice so speech stays clear.',
  },
  {
    icon: Crop,
    title: '9:16 Auto-Crop',
    description: 'Smart center-crop to vertical format. Optimized for TikTok, Shorts, and Reels.',
  },
  {
    icon: Target,
    title: 'Hook Score AI',
    description: 'Every clip gets a virality score from 0-100. Know exactly which moments will stop the scroll.',
  },
  {
    icon: Download,
    title: 'Direct MP4 Downloads',
    description: 'Download upload-ready MP4 files directly with no extra extraction steps.',
  },
];

const STEPS = [
  { number: '01', title: 'Paste Link or Upload', description: 'Drop a video file or paste a link from any major platform.' },
  { number: '02', title: 'AI Finds Best Hooks', description: 'Gemini AI scans the transcript and selects your 3 most viral moments.' },
  { number: '03', title: 'Choose Your Music', description: 'Pick a background track for each clip. Preview before you commit.' },
  { number: '04', title: 'Download Clips', description: 'Browser renders everything locally. No server queue. Download in minutes.' },
];

const PLATFORMS = [
  { name: 'YouTube', color: '#FF0000', symbol: 'YT' },
  { name: 'TikTok', color: '#69C9D0', symbol: 'TT' },
  { name: 'Instagram', color: '#E1306C', symbol: 'IG' },
  { name: 'X / Twitter', color: '#888888', symbol: 'X' },
  { name: 'Facebook', color: '#1877F2', symbol: 'f' },
];

const TESTIMONIALS = [
  {
    name: 'Alex Rivera',
    role: 'YouTube Creator - 280K subs',
    quote: 'ClipForge cut my editing time from 4 hours to under 15 minutes per video. The hook scores are genuinely accurate.',
    initials: 'AR',
    color: '#6EE7B7',
  },
  {
    name: 'Sarah Kim',
    role: 'Social Media Agency Owner',
    quote: 'We process 20+ podcasts a week for clients. The AI consistently picks the best moments. Our engagement is up 3x.',
    initials: 'SK',
    color: '#818CF8',
  },
  {
    name: 'Marcus Chen',
    role: 'TikTok Educator - 1.2M followers',
    quote: 'The clean vertical crop looks ready to post. It feels like I spent hours in Premiere, but it took minutes.',
    initials: 'MC',
    color: '#FB923C',
  },
];

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 cf-glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">ClipForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--cf-muted)]">
            <a href="#features" className="hover:text-[var(--cf-text)] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--cf-text)] transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="cf-btn-ghost text-sm">Sign in</Link>
            <Link href="/dashboard" className="cf-btn-primary text-sm px-4 py-2">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="cf-hero-gradient pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-[var(--cf-accent)]/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--cf-accent)]/20 bg-[var(--cf-accent)]/5 text-xs font-medium text-[var(--cf-accent)] mb-6"
          >
            <div className="cf-pulse-dot" />
            Powered by Gemini 1.5 Flash + Groq Whisper
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Turn Any Long Video Into
            <span className="block cf-gradient-text">3 Viral Clips</span>
            in 60 Seconds.
          </h1>

          <p className="text-lg md:text-xl text-[var(--cf-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste a link or upload a video. AI finds your best hooks, crops to vertical,
            adds background music, and exports clean MP4 clips. Done.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" id="hero-cta" className="cf-btn-primary text-base px-8 py-4">
              <Zap className="w-5 h-5" />
              Start Clipping Free
            </Link>
            <a href="#how-it-works" className="cf-btn-secondary text-base px-8 py-4">
              <Play className="w-4 h-4" />
              See How It Works
            </a>
          </div>

          <p className="text-xs text-[var(--cf-muted)] mt-4">Upload a video and start clipping locally.</p>
        </motion.div>

        {/* Demo mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-4xl mx-auto mt-20"
        >
          <div className="cf-card p-1 shadow-2xl animate-glow">
            <div className="rounded-xl overflow-hidden bg-[#0D0D0D] aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--cf-accent)]/10 border border-[var(--cf-accent)]/20 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-[var(--cf-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--cf-text)]">ClipForge Dashboard</p>
                  <p className="text-xs text-[var(--cf-muted)] mt-1">Paste a link or upload to get started</p>
                </div>
                <Link href="/dashboard" className="cf-btn-primary text-sm px-6 py-2.5 inline-flex">
                  Try it live
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">How It Works</h2>
            <p className="text-[var(--cf-muted)] text-lg">From raw video to viral clips in 4 simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[var(--cf-accent)]/20 to-transparent" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] flex flex-col items-center justify-center mb-4 relative z-10">
                  <span className="text-xs font-bold text-[var(--cf-accent)]">{step.number}</span>
                </div>
                <h3 className="font-bold text-[var(--cf-text)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--cf-muted)] leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-[var(--cf-surface)]/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">Everything You Need</h2>
            <p className="text-[var(--cf-muted)] text-lg">Professional short-form video creation, automated end-to-end</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="cf-card p-6 space-y-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--cf-accent)]/10 border border-[var(--cf-accent)]/20 flex items-center justify-center group-hover:bg-[var(--cf-accent)]/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-[var(--cf-accent)]" />
                </div>
                <h3 className="font-bold text-[var(--cf-text)]">{feature.title}</h3>
                <p className="text-sm text-[var(--cf-muted)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-[var(--cf-muted)] mb-8 uppercase tracking-widest font-medium">Supported Platforms</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {PLATFORMS.map((platform, i) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center text-xl font-bold transition-all duration-200 group-hover:scale-105"
                  style={{ borderColor: platform.color + '30', background: platform.color + '10', color: platform.color }}
                >
                  {platform.symbol}
                </div>
                <span className="text-xs text-[var(--cf-muted)]">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">Loved by Creators</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="cf-card p-6 space-y-4"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--cf-text)] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--cf-text)]">{t.name}</p>
                    <p className="text-xs text-[var(--cf-muted)]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center cf-card p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--cf-accent)]/5 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Ready to go viral?
            </h2>
            <p className="text-[var(--cf-muted)] mb-8">
              Join thousands of creators clipping smarter with AI.
            </p>
            <Link href="/dashboard" className="cf-btn-primary text-base px-8 py-4">
              <Zap className="w-5 h-5" />
              Open Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--cf-border)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold">ClipForge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--cf-muted)]">
              <Link href="/terms" className="hover:text-[var(--cf-text)] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[var(--cf-text)] transition-colors">Privacy</Link>
              <a href="mailto:hello@clipforge.app" className="hover:text-[var(--cf-text)] transition-colors">Contact</a>
            </div>
            <p className="text-xs text-[var(--cf-muted)]">
              &copy; {new Date().getFullYear()} ClipForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
