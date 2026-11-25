import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-text)] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 text-sm text-[var(--cf-muted)] hover:text-[var(--cf-text)] transition-colors">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center">
            <Zap className="w-3 h-3 text-black" strokeWidth={2.5} />
          </div>
          ClipForge
        </Link>

        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-[var(--cf-muted)] mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-sm text-[var(--cf-muted)] leading-relaxed">
          {[{
            title: '1. Acceptance of Terms',
            content: 'By accessing or using ClipForge, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.',
          }, {
            title: '2. Use of Service',
            content: 'ClipForge provides AI-powered video clipping tools. You are responsible for ensuring you have the right to process any video content you submit. Do not submit content that violates copyright, contains illegal material, or infringes on the rights of others.',
          }, {
            title: '3. Free Tier Limitations',
            content: 'Free accounts are limited to 3 clip generations per month. Limits reset on the 1st of each month.',
          }, {
            title: '4. Service Availability',
            content: 'ClipForge depends on browser processing and AI APIs. Processing may fail if a provider is unavailable, a video is too large, or the audio is unclear.',
          }, {
            title: '5. Data and Storage',
            content: 'Video files are processed and temporarily stored in Firebase Storage. Files are automatically deleted after download or within 24 hours. We do not retain your video content long-term.',
          }, {
            title: '6. Limitation of Liability',
            content: 'ClipForge is provided "as is" without warranties. We are not liable for any damages arising from your use of the service, including loss of data or revenue.',
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
