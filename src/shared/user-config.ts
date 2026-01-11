import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.qwencli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface UserSettings {
    OPENAI_API_KEY?: string;
    OPENAI_BASE_URL?: string;
    MODEL_NAME?: string;
}

export function getUserConfig(): UserSettings {
    if (!fs.existsSync(CONFIG_FILE)) {
        return {};
    }
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to read user config:', error);
        return {};
    }
}

export function saveUserConfig(settings: UserSettings): void {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        const current = getUserConfig();
        const updated = { ...current, ...settings };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    } catch (error) {
        console.error('Failed to save user config:', error);
    }
}

export function ensureApiKey(onComplete: (key: string) => void): void {
    const config = getUserConfig();
    
    // 1. Check process.env (already set by shell or .env)
    if (process.env.OPENAI_API_KEY) {
        onComplete(process.env.OPENAI_API_KEY);
        return;
    }

    // 2. Check persistent config
    if (config.OPENAI_API_KEY) {
        process.env.OPENAI_API_KEY = config.OPENAI_API_KEY;
        onComplete(config.OPENAI_API_KEY);
        return;
    }

    // 3. Prompt user if missing
    import('readline').then((readline) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log('\n🚀 Welcome to QwenCLI!');
        console.log('To get started, you need to provide an OpenAI-compatible API Key.');
        
        rl.question('Please enter your OPENAI_API_KEY: ', (answer) => {
            const key = answer.trim();
            if (key) {
                saveUserConfig({ OPENAI_API_KEY: key });
                process.env.OPENAI_API_KEY = key;
                console.log('✅ API Key saved to ' + CONFIG_FILE);
                rl.close();
                onComplete(key);
            } else {
                console.log('❌ API Key is required to run QwenCLI.');
                rl.close();
                process.exit(1);
            }
        });
    });
}
