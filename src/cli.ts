import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureApiKey, getUserConfig } from './shared/user-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'server', 'index.js');

// 1. Ensure API Key exists
ensureApiKey(() => {
    const userConfig = getUserConfig();
    
    // 2. Start the background server with merged environment
    const server = spawn(process.execPath, [serverPath], {
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { 
            ...process.env,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            OPENAI_BASE_URL: userConfig.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL,
            MODEL_NAME: userConfig.MODEL_NAME || process.env.MODEL_NAME,
        },
    });

    function cleanup() {
        if (!server.killed) {
            server.kill();
        }
    }

    process.on('exit', cleanup);
    process.on('SIGINT', () => {
        cleanup();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        cleanup();
        process.exit(0);
    });

    // 3. Launch the Client UI
    setTimeout(async () => {
        try {
            await import('./client/index.js');
        } catch (error) {
            console.error('Failed to start Client UI:', error);
            cleanup();
            process.exit(1);
        }
    }, 1000);
});

