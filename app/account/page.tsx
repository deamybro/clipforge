'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { updateUserProfile } from '@/lib/firestore';
import { updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { User, Key, AlertTriangle, Loader2, Copy, RefreshCw } from 'lucide-react';

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return 'cf_' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateUserProfile(user.uid, { displayName });
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!user) return;
    const newKey = generateApiKey();
    try {
      await updateUserProfile(user.uid, { apiKey: newKey });
      await refreshProfile();
      toast.success('API key regenerated');
    } catch {
      toast.error('Failed to regenerate API key');
    }
  };

  const handleCopyApiKey = () => {
    if (profile?.apiKey) {
      navigator.clipboard.writeText(profile.apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }
      toast.success('Account deleted');
      window.location.href = '/';
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cf-text)]">Account Settings</h1>
          <p className="text-sm text-[var(--cf-muted)] mt-1">Manage your profile and preferences</p>
        </div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="cf-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-[var(--cf-muted)]" />
            <h2 className="font-semibold text-[var(--cf-text)]">Profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs text-[var(--cf-muted)] font-medium block mb-1.5">Display Name</label>
              <input
                id="account-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="cf-input"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--cf-muted)] font-medium block mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="cf-input opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-[var(--cf-muted)] mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="cf-btn-primary"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* API Key */}
        {profile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="cf-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-[var(--cf-muted)]" />
              <h2 className="font-semibold text-[var(--cf-text)]">API Access</h2>
            </div>

            <p className="text-sm text-[var(--cf-muted)]">Use your API key to access ClipForge programmatically. See the <a href="/docs/api" className="text-[var(--cf-accent)] hover:underline">API documentation</a>.</p>

            <div className="space-y-2">
              <label className="text-xs text-[var(--cf-muted)] font-medium block">API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 font-mono text-sm cf-input py-2">
                  {profile.apiKey
                    ? showApiKey
                      ? profile.apiKey
                      : '••••••••••••••••••••••••••••••••••••••••'
                    : 'No API key generated yet'}
                </div>
                {profile.apiKey && (
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="cf-btn-secondary px-3 py-2 text-xs"
                  >
                    {showApiKey ? 'Hide' : 'Reveal'}
                  </button>
                )}
                {profile.apiKey && (
                  <button onClick={handleCopyApiKey} className="cf-btn-secondary px-3 py-2">
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleRegenerateApiKey}
                className="cf-btn-ghost text-sm flex items-center gap-1.5 text-[var(--cf-muted)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {profile.apiKey ? 'Regenerate key' : 'Generate API key'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="cf-card p-6 space-y-4 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-red-400">Danger Zone</h2>
          </div>

          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--cf-text)]">Delete Account</p>
                <p className="text-xs text-[var(--cf-muted)] mt-0.5">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--cf-text)]">
                This action is <strong>irreversible</strong>. Type <code className="px-1 py-0.5 rounded bg-white/10 text-xs">DELETE</code> to confirm.
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="cf-input border-red-500/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-red-600 transition-colors"
                >
                  {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />Deleting...</> : 'Permanently Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  className="cf-btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
