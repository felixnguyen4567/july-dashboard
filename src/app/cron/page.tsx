'use client';

import { useEffect, useState } from 'react';
import { 
  Clock, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { getCronJobs, forceRunCron } from '../actions';
import { toast } from 'sonner';

export default function CronPage() {
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const data = await getCronJobs();
    setCronJobs(data);
    setLoading(false);
  };

  const handleForceRun = async (command: string) => {
    toast.info("Force running cron job...");
    const result = await forceRunCron(command);
    if (result?.success) {
      toast.success("Cron job triggered successfully");
    } else {
      toast.error("Failed to run cron job");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cron Monitor</h1>
          <p className="text-white/60 mt-2">Manage and monitor automated OpenClaw schedules.</p>
        </div>
        <button 
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Sync Schedules
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && cronJobs.length === 0 ? (
          <div className="glass-panel p-8 text-center text-white/50">Fetching crontab from EC2...</div>
        ) : cronJobs.length === 0 ? (
          <div className="glass-panel p-8 text-center text-white/50">No cron jobs found on EC2 instance.</div>
        ) : (
          cronJobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4 flex-1 overflow-hidden">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-white truncate">Job #{job.id + 1}</h3>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <p className="text-white/60 text-sm mt-1 font-mono truncate">{job.command}</p>
                  
                  <div className="flex flex-wrap items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{job.schedule}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => handleForceRun(job.command)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5" 
                  title="Force Run"
                >
                  <PlayCircle className="w-5 h-5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

