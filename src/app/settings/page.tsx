'use client';

import { useState, useEffect } from 'react';
import { Server, Save, Loader2, FileJson, Download, ShieldCheck } from 'lucide-react';
import { getConfig, saveConfig, createBackup } from '../actions';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'main' | 'plugins' | 'env' | 'cron' | 'backup'>('main');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    if (activeTab === 'backup') return;
    fetchConfig();
  }, [activeTab]);

  const fetchConfig = async () => {
    setLoading(true);
    const result = await getConfig(activeTab as any);
    if (result.success) {
      setContent(result.content || '');
    } else {
      setContent('// Error fetching configuration\n// File might not exist or agent is down.');
      toast.error(`Failed to fetch ${activeTab.toUpperCase()} config`);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveConfig(activeTab as any, content);
    if (result.success) {
      toast.success(`${activeTab.toUpperCase()} Configuration saved successfully.`);
    } else {
      toast.error(result.error || 'Failed to save configuration.');
    }
    setSaving(false);
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    toast.info("Generating system backup, please wait...");
    const result = await createBackup();
    if (result.success && result.data) {
      try {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/gzip' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openclaw-backup-${new Date().toISOString().slice(0,10)}.tar.gz`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Backup downloaded successfully!");
      } catch (e) {
        toast.error("Failed to decode backup data.");
      }
    } else {
      toast.error(result.error || "Failed to create backup.");
    }
    setBackingUp(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Settings</h1>
          <p className="text-white/60 mt-2">Manage OpenClaw Agent, MCPs, Secrets, and Schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== 'backup' && (
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative">
        
        {/* Tabs */}
        <div className="flex flex-wrap items-center p-2 border-b border-white/10 shrink-0 bg-black/20 gap-2">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'main' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            openclaw.json
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plugins' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileJson className="w-4 h-4" />
            plugins/installs.json
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'env' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileJson className="w-4 h-4" />
            .env (Secrets)
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cron' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            Crontab (Schedule)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ml-auto ${
              activeTab === 'backup' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-primary/70 hover:text-primary hover:bg-primary/10 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Backup & Restore
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-[#1E1E1E]">
          {activeTab === 'backup' ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h2 className="text-xl font-bold mb-2">System Configuration Backup</h2>
                <p className="text-white/60 text-sm mb-6">
                  Download a complete snapshot of your OpenClaw settings, including MCP configurations, secrets (.env), and task inbox. Keep this file safe.
                </p>
                <button
                  onClick={handleCreateBackup}
                  disabled={backingUp}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {backingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {backingUp ? 'Compressing & Downloading...' : 'Download Full Backup (.tar.gz)'}
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p>Loading configuration from EC2...</p>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-transparent text-white/90 font-mono text-sm leading-relaxed resize-none focus:outline-none"
              spellCheck="false"
            />
          )}
        </div>
      </div>
    </div>
  );
}
