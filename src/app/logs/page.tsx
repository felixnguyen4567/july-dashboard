'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Download, Play, Pause, AlertTriangle } from 'lucide-react';
import { getLiveLogs, exportFullLogs } from '../actions';
import { toast } from 'sonner';

export default function LogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [exporting, setExporting] = useState(false);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLogs() {
      if (isPaused) return;
      const data = await getLiveLogs();
      if (data && data.length > 0) {
        setLogs(data);
      }
    }
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const handleExport = async () => {
    setExporting(true);
    toast.info("Preparing logs for download...");
    const res = await exportFullLogs();
    if (res.success && res.log) {
      const blob = new Blob([res.log], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openclaw-logs-${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Logs downloaded successfully");
    } else {
      toast.error("Failed to export logs from server.");
    }
    setExporting(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Feed</h1>
          <p className="text-white/60 mt-2">Real-time system logs and agent execution traces.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors border ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
            }`} 
            title={isPaused ? "Resume Auto-scroll" : "Pause Auto-scroll"}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative font-mono text-sm">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 p-4 border-b border-white/10 shrink-0 bg-black/20">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="ml-4 flex items-center gap-2 text-white/40 text-xs">
            <Terminal className="w-3 h-3" />
            <span>ubuntu@16.51.145.141:~/.pm2/logs/openclaw-agent-out.log</span>
          </div>
        </div>

        {/* Log Output */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {logs.length === 0 ? (
            <div className="text-white/30 text-center mt-10">Waiting for logs...</div>
          ) : (
            logs.map((line, i) => {
              const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
              const isWarn = line.toLowerCase().includes('warn');
              return (
                <div key={i} className={`font-mono text-xs hover:bg-white/5 p-1 rounded transition-colors break-all ${
                  isError ? 'text-red-300' : isWarn ? 'text-amber-300' : 'text-white/80'
                }`}>
                  {line}
                </div>
              );
            })
          )}
          
          <div className="flex items-center gap-2 text-primary animate-pulse pt-4">
            <span className="text-primary/50">█</span>
            <span className="text-white/40">{isPaused ? 'Paused...' : 'Waiting for new events...'}</span>
          </div>
          
          <div ref={endOfLogsRef} />
        </div>

      </div>
    </div>
  );
}

