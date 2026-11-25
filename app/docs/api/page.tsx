import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Code, Key, Zap } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cf-text)]">API Documentation</h1>
          <p className="text-sm text-[var(--cf-muted)] mt-1">Integrate ClipForge into your own workflow</p>
        </div>

        <div className="cf-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[var(--cf-accent)]" />
            <h2 className="font-semibold text-[var(--cf-text)]">Authentication</h2>
          </div>
          <p className="text-sm text-[var(--cf-muted)]">Include your API key in the request header:</p>
          <pre className="bg-[var(--cf-bg)] border border-[var(--cf-border)] rounded-lg p-4 text-xs font-mono text-[var(--cf-accent)] overflow-x-auto">
{`Authorization: Bearer cf_your_api_key_here`}
          </pre>
          <p className="text-xs text-[var(--cf-muted)]">API access is available on the Agency plan only. Generate your key in Account settings.</p>
        </div>

        <div className="cf-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-[var(--cf-accent)]" />
            <h2 className="font-semibold text-[var(--cf-text)]">Endpoints</h2>
          </div>

          <div className="space-y-6">
            {[{
              method: 'POST',
              path: '/api/transcribe',
              description: 'Transcribe audio from a video file',
              body: `FormData:
  audio: File (mp3/mp4)
  idToken: string (Firebase ID token)`,
              response: `{
  text: string,
  words: [{word, start, end}],
  segments: [{start, end, text}]
}`,
            }, {
              method: 'POST',
              path: '/api/analyze',
              description: 'Detect viral clip moments from a transcript',
              body: `JSON:
  transcriptText: string
  idToken: string`,
              response: `{
  clips: [{
    title: string,
    hook: string,
    start_time: number,
    end_time: number,
    hook_score: number
  }]
}`,
            }, {
              method: 'POST',
              path: '/api/download',
              description: 'Download a video from a supported platform URL',
              body: `JSON:
  url: string (YouTube/TikTok/Instagram/X/Facebook)
  idToken: string`,
              response: `{
  storage_path: string (Firebase Storage path)
}`,
            }].map((endpoint) => (
              <div key={endpoint.path} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[var(--cf-accent)]/10 text-[var(--cf-accent)] border border-[var(--cf-accent)]/20">
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-[var(--cf-text)]">{endpoint.path}</code>
                </div>
                <p className="text-sm text-[var(--cf-muted)]">{endpoint.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--cf-muted)] font-medium mb-1">Request body</p>
                    <pre className="bg-[var(--cf-bg)] border border-[var(--cf-border)] rounded-lg p-3 text-xs font-mono text-[var(--cf-text)] overflow-x-auto whitespace-pre-wrap">
                      {endpoint.body}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--cf-muted)] font-medium mb-1">Response</p>
                    <pre className="bg-[var(--cf-bg)] border border-[var(--cf-border)] rounded-lg p-3 text-xs font-mono text-[var(--cf-accent)] overflow-x-auto whitespace-pre-wrap">
                      {endpoint.response}
                    </pre>
                  </div>
                </div>
                <div className="h-px bg-[var(--cf-border)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="cf-card p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-[var(--cf-accent)]" />
            <p className="text-sm text-[var(--cf-muted)]">
              Rate limit: 10 requests per hour per API key. Responses are cached for 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
