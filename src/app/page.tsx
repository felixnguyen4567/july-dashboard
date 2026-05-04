'use client';

import { useEffect, useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  WifiOff,
  CheckCircle2, 
  AlertCircle,
  Clock,
  Play,
  Zap,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { getSystemMetrics, triggerHeartbeat, runDoctorDiagnostics, getActiveMcpServers } from './actions';

export default function Home() {
  const [metrics, setMetrics] = useState<any>(null);
  const [mcps, setMcps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [doctorResult, setDoctorResult] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Run both queries in parallel instead of sequential
      const [metricsData, mcpData] = await Promise.all([
        getSystemMetrics(),
        getActiveMcpServers(),
      ]);
      setMetrics(metricsData);
      setMcps(mcpData);
      setLoading(false);
      setLastUpdated(new Date());
    }
    
    fetchData();
    const interval = setInterval(fetchData, 8000); // Reduced from 5s → 8s since batch is faster
    return () => clearInterval(interval);
  }, []);

  const handleHeartbeat = async () => {
    setTriggering(true);
    const result = await triggerHeartbeat();
    if (result?.success) {
      toast.success("Agent heartbeat triggered successfully");
    } else {
      toast.error("Failed to trigger agent heartbeat");
    }
    setTimeout(() => setTriggering(false), 2000);
  };

  const handleDoctor = async () => {
    setDoctorRunning(true);
    toast.info("Running openclaw doctor...");
    const res = await runDoctorDiagnostics();
    if (res.success) {
      setDoctorResult(res.result || 'No output');
      toast.success("Diagnostics complete");
    } else {
      toast.error("Diagnostics failed: " + res.error);
    }
    setDoctorRunning(false);
  };

  const handleResetCron = async () => {
    setResetting(true);
    toast.info("Resetting cron jobs...");
    await triggerHeartbeat();
    toast.success("Cron jobs reset via agent restart");
    setTimeout(() => setResetting(false), 2000);
  };

  // Determine color based on usage level
  const getUsageColor = (value: number) => {
    if (value >= 90) return 'text-red-400 bg-red-500';
    if (value >= 70) return 'text-amber-400 bg-amber-500';
    return 'text-green-400 bg-green-500';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-white/60 mt-2">
            Monitor OpenClaw EC2 infrastructure and agent health.
            {lastUpdated && (
              <span className="ml-2 text-white/30 text-xs">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {metrics?.version && metrics.version !== 'unknown' && (
            <span className="text-xs font-mono text-white/40 px-2 py-1 rounded-md bg-white/5 border border-white/5">
              v{metrics.version}
            </span>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            metrics?.pm2Online 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${metrics?.pm2Online ? 'bg-green-500' : 'bg-red-500'}`} />
            {metrics?.pm2Online ? 'Agent Online' : 'Agent Offline'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CPU */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-white/50">EC2 t3.small</span>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${loading ? '' : getUsageColor(parseFloat(metrics?.cpu || '0')).split(' ')[0]}`}>
              {loading ? '--' : metrics?.cpu}%
            </h3>
            <p className="text-sm text-white/60 mt-1">CPU Usage</p>
          </div>
          {!loading && metrics?.cpu && (
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${getUsageColor(parseFloat(metrics.cpu)).split(' ')[1]}`}
                style={{ width: `${Math.min(parseFloat(metrics.cpu), 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Memory */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-white/50">1910 MB Total</span>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${loading ? '' : getUsageColor(parseFloat(metrics?.memory || '0')).split(' ')[0]}`}>
              {loading ? '--' : metrics?.memory}%
            </h3>
            <p className="text-sm text-white/60 mt-1">Memory (RAM)</p>
          </div>
          {!loading && metrics?.memory && (
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${getUsageColor(parseFloat(metrics.memory)).split(' ')[1]}`}
                style={{ width: `${Math.min(parseFloat(metrics.memory), 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Disk */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-white/50">20 GB Total</span>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${loading ? '' : getUsageColor(metrics?.disk || 0).split(' ')[0]}`}>
              {loading ? '--' : metrics?.disk}%
            </h3>
            <p className="text-sm text-white/60 mt-1">Disk Usage</p>
          </div>
          {!loading && metrics?.disk && (
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${getUsageColor(metrics.disk).split(' ')[1]}`}
                style={{ width: `${Math.min(metrics.disk, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* SSH Connection — now dynamic */}
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            {metrics?.sshOk ? <Wifi className="w-24 h-24" /> : <WifiOff className="w-24 h-24" />}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${metrics?.sshOk ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {metrics?.sshOk 
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <AlertCircle className="w-5 h-5 text-red-400" />
                }
              </div>
              <span className="text-xs font-medium text-white/50">IPv4</span>
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${metrics?.sshOk ? 'text-green-400' : 'text-red-400'}`}>
                {loading ? '--' : metrics?.sshOk ? 'Connected' : 'Offline'}
              </h3>
              <p className="text-sm text-white/60 mt-1">SSH Tunnel</p>
            </div>
          </div>
        </div>

      </div>

      {/* Uptime Row */}
      {metrics?.uptime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Timer className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Server Uptime</p>
              <p className="font-semibold text-white/90">{metrics.uptime}</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Agent Uptime</p>
              <p className="font-semibold text-white/90">{metrics.agentUptime || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plugins */}
        <div className="glass-panel p-6 col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Active Plugins</h2>
            <span className="text-xs text-white/40 px-2 py-1 rounded-md bg-white/5">
              {mcps.length} enabled
            </span>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            
            {mcps.length === 0 && !loading && (
              <p className="text-white/50 text-sm">No enabled plugins found.</p>
            )}
            
            {mcps.map((mcp) => (
              <div key={mcp.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <Server className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{mcp.name}</h4>
                    <p className="text-xs text-white/40 truncate max-w-xs">{mcp.command}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-white/60">{mcp.status}</span>
                </div>
              </div>
            ))}
            
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={handleHeartbeat}
              disabled={triggering}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 text-white font-medium text-sm disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              {triggering ? 'Triggering...' : 'Restart Agent'}
            </button>
            <button 
              onClick={handleResetCron}
              disabled={resetting}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 font-medium text-sm text-white/80 disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {resetting ? 'Resetting...' : 'Reset Cron Jobs'}
            </button>
            <button 
              onClick={handleDoctor}
              disabled={doctorRunning}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 font-medium text-sm text-red-400 disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" />
              {doctorRunning ? 'Running Doctor...' : 'Run Doctor Diagnostics'}
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Diagnostics Results Modal */}
      {doctorResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDoctorResult(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[80vh] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Doctor Diagnostics
              </h3>
              <button onClick={() => setDoctorResult(null)} className="text-white/40 hover:text-white transition-colors text-sm">
                Close ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              <pre className="font-mono text-xs text-white/80 whitespace-pre-wrap break-words leading-relaxed">{doctorResult}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
