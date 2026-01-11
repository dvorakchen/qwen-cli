import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getCodeSimplifierPrompt(): string {
    const promptPath = path.join(__dirname, 'code-simplifier.md');
    try {
        return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
        console.error('Failed to read code-simplifier.md', error);
        return 'Error: Could not load code simplification prompt.';
    }
}
