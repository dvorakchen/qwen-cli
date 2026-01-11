import os from 'os';
import { Tool } from './interface.js';

export const getSystemInfoTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'get_system_info',
            description: 'Get basic system information like OS and CPU architecture.',
            parameters: { type: 'object', properties: {} },
        },
    },
    handler: () => {
        return JSON.stringify({
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            release: os.release(),
        });
    },
};
