import { NodeSSH } from 'node-ssh';
import path from 'path';

const EC2_HOST = process.env.EC2_HOST || '16.51.145.141';
const EC2_USER = process.env.EC2_USER || 'ubuntu';
// Resolve the path dynamically based on the local environment
const KEY_PATH = process.env.EC2_KEY_PATH 
  ? path.resolve(process.cwd(), process.env.EC2_KEY_PATH)
  : path.resolve(process.cwd(), '../openclaw-key.pem');

export async function executeSSH(command: string): Promise<string> {
  const ssh = new NodeSSH();
  
  try {
    await ssh.connect({
      host: EC2_HOST,
      username: EC2_USER,
      privateKeyPath: KEY_PATH,
    });

    const result = await ssh.execCommand(command);
    
    if (result.code !== 0 && result.stderr) {
      console.warn(`SSH Command Warning [${command.slice(0, 80)}]: ${result.stderr.slice(0, 200)}`);
    }
    
    return result.stdout || result.stderr;
  } catch (error) {
    console.error('SSH Connection/Execution Error:', error);
    throw new Error(`Failed to execute SSH command: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    ssh.dispose();
  }
}

/**
 * Execute multiple commands on a SINGLE SSH connection.
 * Returns results as a Map keyed by command labels.
 * This dramatically reduces latency vs calling executeSSH() multiple times.
 */
export async function executeSSHBatch(
  commands: Record<string, string>
): Promise<Record<string, string>> {
  const ssh = new NodeSSH();
  const results: Record<string, string> = {};

  try {
    await ssh.connect({
      host: EC2_HOST,
      username: EC2_USER,
      privateKeyPath: KEY_PATH,
    });

    for (const [label, command] of Object.entries(commands)) {
      try {
        const result = await ssh.execCommand(command);
        results[label] = result.stdout || result.stderr || '';
      } catch {
        results[label] = '';
      }
    }

    return results;
  } catch (error) {
    console.error('SSH Batch Error:', error);
    throw new Error(`SSH batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    ssh.dispose();
  }
}
