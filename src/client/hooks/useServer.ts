import { useEffect, useState } from 'react';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function useServer() {
    const [status, setStatus] = useState('Booting Server...');
    const [serverPid, setServerPid] = useState<number | undefined>(undefined);
    const [currentPath, setCurrentPath] = useState<string>('');

    // Poll for initial CWD once server is ready
    useEffect(() => {
        const fetchCwd = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/cwd');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentPath(data.cwd);
                    setStatus('Ready'); // Assume ready if we can fetch CWD
                }
            } catch (e) {
                // Ignore errors during boot
            }
        };

        const interval = setInterval(fetchCwd, 1000);
        return () => clearInterval(interval);
    }, []);

    async function changeDirectory(targetPath: string): Promise<{ success: boolean; message?: string }> {
        try {
            const res = await fetch('http://localhost:3000/api/cwd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: targetPath }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setCurrentPath(data.cwd);
                return { success: true };
            } else {
                return { success: false, message: data.error };
            }
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    // Only spawn if NOT in production/CLI mode (simple heuristic: check if we are in node_modules or have a specific flag)
    // For now, preserving original spawn logic but guarding it might be better. 
    // Since the user didn't ask to fix the double-spawn, I'll keep the existing spawn logic 
    // BUT checking CWD is independent.
    
    useEffect(() => {
        // If we are running via 'npm run client', we might need to spawn.
        // If running via 'qwencli', the server is already spawned by cli.ts.
        // We can check if port 3000 is taken, or just rely on the fact that cli.ts starts first.
        
        // ... (existing spawn logic kept for dev compatibility) ...
        const serverPath = path.resolve(__dirname, '../../../src/server/index.ts');

        // Check if server is likely already running (e.g. via CLI wrapper)
        // This is a naive check. For this task, I will leave the spawn logic as is,
        // assuming the user handles dev/prod environments, or that double-spawn isn't fatal (port conflict might be).
        
        const serverProcess = spawn('npx', ['tsx', serverPath], {
            stdio: 'pipe',
            shell: true,
        });

        setServerPid(serverProcess.pid);

        serverProcess.stdout?.on('data', (data) => {
            if (data.toString().includes('running on')) {
                setStatus('Ready (Server Connected)');
            }
        });

        return () => {
            if (serverProcess.pid) {
                try {
                    if (os.platform() === 'win32') {
                        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
                    } else {
                        process.kill(serverProcess.pid, 'SIGTERM');
                    }
                } catch (e) { /* ignore */ }
            }
        };
    }, []);

    return { status, setStatus, currentPath, changeDirectory };
}