import { execSync } from 'child_process';
import { Tool } from './interface.js';

export const runCommandTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'run_command',
            description: 'Run a shell command and return the output. WARNING: Use with caution.',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The command to run.' },
                },
                required: ['command'],
            },
        },
    },
    requiresConfirmation: true,
    handler: (args) => {
        try {
            // TODO: Add command whitelisting or sanitization here for security
            return execSync(args.command, { encoding: 'utf-8', timeout: 10000 }) || '(No Output)';
        } catch (error: any) {
            return `Command Failed: ${error.message}`;
        }
    },
};
