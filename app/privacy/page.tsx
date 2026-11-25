import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 text-sm text-[var(--cf-muted)] hover:text-[var(--cf-text)] transition-colors">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center">
            <Zap className="w-3 h-3 text-black" strokeWidth={2.5} />
          </div>
          ClipForge
        </Link>

        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-[var(--cf-muted)] mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-sm text-[var(--cf-muted)] leading-relaxed">
          {[{
            title: 'Information We Collect',
            content: 'We collect your email address and name when you create an account. We also collect metadata about clips you generate (title, timestamps, hook scores) for your history feature. We do not store your video content long-term.',
          }, {
            title: 'How We Use Information',
            content: 'Your information is used to provide and improve the ClipForge service and send account notifications.',
          }, {
            title: 'Video Content',
            content: 'Videos you upload or link are temporarily stored in Firebase Storage for processing. They are automatically deleted after download or within 24 hours, whichever comes first. We do not use your video content for training AI models.',
          }, {
            title: 'Third-Party Services',
            content: 'ClipForge uses Firebase (Google) for authentication and storage, Groq for transcription, and Google Gemini for AI analysis. Each of these services has their own privacy policy.',
          }, {
            title: 'Data Retention',
            content: 'Account metadata is retained as long as your account is active. Clip metadata (titles, scores, dates) is retained per your plan limits. You can delete all data by deleting your account.',
          }, {
            title: 'Contact',
            content: 'For privacy inquiries, contact us at privacy@clipforge.app.',
          }].map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-[var(--cf-text)] mb-2">{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
