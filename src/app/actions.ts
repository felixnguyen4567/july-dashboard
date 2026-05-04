'use server';

import { cookies } from 'next/headers';
import { executeSSH, executeSSHBatch } from '@/lib/ssh';

export async function getSystemMetrics() {
  try {
    const data = await executeSSHBatch({
      cpu: `top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`,
      memory: `free -m | grep Mem | awk '{print ($3/$2)*100}'`,
      disk: `df -h / | tail -1 | awk '{print $5}' | sed 's/%//'`,
      pm2: `pm2 jlist`,
      uptime: `uptime -p`,
      version: `openclaw --version 2>/dev/null || echo 'unknown'`,
    });

    const cpu = parseFloat(data.cpu.trim()).toFixed(1);
    const memory = parseFloat(data.memory.trim()).toFixed(1);
    const disk = parseInt(data.disk.trim());
    
    let pm2Online = false;
    let agentUptime = '';
    try {
      const pm2Data = JSON.parse(data.pm2);
      const agent = pm2Data.find((p: any) => p.name === 'openclaw-agent');
      if (agent?.pm2_env?.status === 'online') {
        pm2Online = true;
        // Calculate agent uptime from pm_uptime
        if (agent.pm2_env.pm_uptime) {
          const ms = Date.now() - agent.pm2_env.pm_uptime;
          const hours = Math.floor(ms / 3600000);
          const minutes = Math.floor((ms % 3600000) / 60000);
          agentUptime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
      }
    } catch {
      // Ignore parse errors
    }

    return {
      cpu,
      memory,
      disk,
      pm2Online,
      uptime: data.uptime.trim().replace('up ', ''),
      agentUptime,
      version: data.version.trim(),
      sshOk: true,
    };
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return null;
  }
}

export async function getActiveMcpServers() {
  try {
    const configRaw = await executeSSH(`cat /home/ubuntu/.openclaw/plugins/installs.json`);
    const data = JSON.parse(configRaw);
    // The correct key is 'plugins', not 'installs'
    const plugins = (data.plugins || []).filter((p: any) => p.enabled);
    return plugins.map((p: any) => ({
      name: p.pluginId,
      command: p.packageName || p.source || '',
      status: p.enabled ? 'Online' : 'Disabled'
    }));
  } catch (error) {
    console.error("Failed to fetch plugins:", error);
    return [];
  }
}

export async function getLiveLogs() {
  try {
    const data = await executeSSHBatch({
      stdout: `tail -n 30 /home/ubuntu/.pm2/logs/openclaw-agent-out.log`,
      stderr: `tail -n 10 /home/ubuntu/.pm2/logs/openclaw-agent-error.log`,
    });
    
    const combined = (data.stdout || '') + '\n' + (data.stderr || '');
    const lines = combined.split('\n').filter(l => l.trim() !== '');
    
    // Clean terminal color codes
    return lines.map(line => line.replace(/\x1B\[[0-9;]*m/g, ''));
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return [];
  }
}

export async function triggerHeartbeat() {
  try {
    // Command to restart PM2 which forces heartbeat to run on startup/next tick
    await executeSSH(`pm2 restart openclaw-agent`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to restart agent" };
  }
}

export async function addTaskToInbox(taskDescription: string) {
  try {
    // Append to INBOX.md
    // Use base64 to avoid escaping issues
    const base64Task = Buffer.from(`\n- [ ] TASK: ${taskDescription}\n`).toString('base64');
    await executeSSH(`echo "${base64Task}" | base64 --decode >> /home/ubuntu/.openclaw/workspace/INBOX.md`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to add task" };
  }
}

export async function getInboxTasks() {
  try {
    const content = await executeSSH(`cat /home/ubuntu/.openclaw/workspace/INBOX.md`);
    const lines = content.split('\n');
    const tasks = lines
      .filter(line => line.trim().startsWith('- ['))
      .map((line, index) => {
        const isCompleted = line.includes('- [x]') || line.includes('- [X]');
        // Strip the checkbox prefix and any label prefix (TASK:, SYSTEM_TEST:, etc.)
        const text = line.replace(/^- \[[ xX]\]\s*/, '').replace(/^(TASK|SYSTEM_TEST|TODO):\s*/i, '').trim();
        // Keep the raw line for precise matching in update operations
        const rawLine = line.trim();
        return { id: index, text, isCompleted, rawLine };
      });
    return tasks;
  } catch (error) {
    console.error("Failed to fetch inbox tasks:", error);
    return [];
  }
}

export async function getCronJobs() {
  try {
    const content = await executeSSH(`crontab -l`);
    const lines = content.split('\n');
    const jobs = lines
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .map((line, index) => {
        // Simple parsing: first 5 tokens are schedule, rest is command
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const schedule = parts.slice(0, 5).join(' ');
          const command = parts.slice(5).join(' ');
          return { id: index, schedule, command, raw: line };
        }
        return { id: index, schedule: 'unknown', command: line, raw: line };
      });
    return jobs;
  } catch (error) {
    console.error("Failed to fetch cron jobs:", error);
    return [];
  }
}


export async function runDoctorDiagnostics() {
  try {
    const result = await executeSSH(`openclaw doctor`);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: "Failed to run doctor" };
  }
}

export async function completeInboxTask(taskText: string) {
  try {
    const filePath = '/home/ubuntu/.openclaw/workspace/INBOX.md';
    const content = await executeSSH(`cat ${filePath}`);
    
    // Find the line containing this task text and change [ ] to [x]
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes(taskText) && line.includes('- [ ]')) {
        return line.replace('- [ ]', '- [x]');
      }
      return line;
    });
    
    const base64Content = Buffer.from(updatedLines.join('\n')).toString('base64');
    await executeSSH(`echo "${base64Content}" | base64 --decode > ${filePath}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to complete task" };
  }
}

export async function deleteInboxTask(taskText: string) {
  try {
    const filePath = '/home/ubuntu/.openclaw/workspace/INBOX.md';
    const content = await executeSSH(`cat ${filePath}`);
    
    // Remove the line containing this task
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.includes(taskText));
    const updatedContent = filtered.join('\n');
    
    const base64Content = Buffer.from(updatedContent).toString('base64');
    await executeSSH(`echo "${base64Content}" | base64 --decode > ${filePath}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete task" };
  }
}

export async function editInboxTask(oldText: string, newText: string) {
  try {
    const filePath = '/home/ubuntu/.openclaw/workspace/INBOX.md';
    const content = await executeSSH(`cat ${filePath}`);
    
    // Find the line containing oldText and replace the text portion
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes(oldText) && line.includes('- [ ]')) {
        return line.replace(oldText, newText);
      }
      return line;
    });
    
    const base64Content = Buffer.from(updatedLines.join('\n')).toString('base64');
    await executeSSH(`echo "${base64Content}" | base64 --decode > ${filePath}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to edit task" };
  }
}

export async function forceRunCron(command: string) {
  try {
    // Run the command in the background on EC2
    await executeSSH(`nohup ${command} > /dev/null 2>&1 &`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to force run cron" };
  }
}
export async function getConfig(type: 'main' | 'plugins' | 'env' | 'cron') {
  try {
    if (type === 'cron') {
      const content = await executeSSH(`crontab -l`);
      return { success: true, content };
    }

    const filePath = type === 'main' 
      ? '/home/ubuntu/.openclaw/openclaw.json'
      : type === 'plugins' 
      ? '/home/ubuntu/.openclaw/plugins/installs.json'
      : '/home/ubuntu/.openclaw/.env';
    const content = await executeSSH(`cat ${filePath}`);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: `Failed to fetch ${type} config` };
  }
}

export async function saveConfig(type: 'main' | 'plugins' | 'env' | 'cron', newContent: string) {
  try {
    if (type === 'cron') {
      const base64Content = Buffer.from(newContent).toString('base64');
      await executeSSH(`echo "${base64Content}" | base64 --decode | crontab -`);
      return { success: true };
    }

    const filePath = type === 'main' 
      ? '/home/ubuntu/.openclaw/openclaw.json'
      : type === 'plugins' 
      ? '/home/ubuntu/.openclaw/plugins/installs.json'
      : '/home/ubuntu/.openclaw/.env';
    
    // Validate JSON before saving to avoid breaking the agent
    if (type === 'main' || type === 'plugins') {
      JSON.parse(newContent);
    }

    // Base64 encode to safely write over SSH without escaping issues
    const base64Content = Buffer.from(newContent).toString('base64');
    await executeSSH(`echo "${base64Content}" | base64 --decode > ${filePath}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save config" };
  }
}

export async function createBackup() {
  try {
    const backupCmd = `
      cd /home/ubuntu && 
      tar -czf openclaw_backup.tar.gz .openclaw &&
      base64 openclaw_backup.tar.gz &&
      rm openclaw_backup.tar.gz
    `;
    const b64Data = await executeSSH(backupCmd);
    // Clean up whitespace/newlines from the base64 output
    const cleanB64 = b64Data.replace(/\s/g, '');
    return { success: true, data: cleanB64 };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create backup" };
  }
}

export async function exportFullLogs() {
  try {
    const data = await executeSSHBatch({
      stdout: `tail -n 1000 /home/ubuntu/.pm2/logs/openclaw-agent-out.log`,
      stderr: `tail -n 500 /home/ubuntu/.pm2/logs/openclaw-agent-error.log`,
    });
    
    const combined = "--- STDOUT ---\n" + (data.stdout || '') + "\n\n--- STDERR ---\n" + (data.stderr || '');
    const cleanLog = combined.replace(/\x1B\[[0-9;]*m/g, '');
    
    return { success: true, log: cleanLog };
  } catch (error) {
    return { success: false, error: "Failed to export logs" };
  }
}

export async function authenticate(password: string) {
  const correctPassword = process.env.DASHBOARD_PASSWORD || 'openclaw2026';
  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set('openclaw-auth', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true };
  }
  return { success: false, error: 'Incorrect password' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('openclaw-auth');
  return { success: true };
}
