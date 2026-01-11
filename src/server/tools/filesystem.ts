import fs from 'fs';
import path from 'path';
import { Tool } from './interface.js';

const getSafePath = (targetPath: string): string => {
    const resolved = path.resolve(process.cwd(), targetPath);
    // Security Check: Prevent Path Traversal
    if (!resolved.startsWith(process.cwd())) {
        throw new Error(`Access Denied: Path ${targetPath} is outside the project root.`);
    }
    return resolved;
};

export const writeFileTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'write_file',
            description:
                'Write content to a file. Overwrites if exists. Automatically creates directories.',
            parameters: {
                type: 'object',
                properties: {
                    file_path: { type: 'string', description: 'Relative path to file.' },
                    content: { type: 'string', description: 'Content to write.' },
                },
                required: ['file_path', 'content'],
            },
        },
    },
    requiresConfirmation: true,
    handler: (args) => {
        try {
            const filePath = getSafePath(args.file_path);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, args.content, 'utf-8');
            return `Successfully wrote to ${args.file_path}`;
        } catch (e: any) {
            return `Write Error: ${e.message}`;
        }
    },
};

export const readFileTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Read the content of a file.',
            parameters: {
                type: 'object',
                properties: {
                    file_path: { type: 'string', description: 'Relative path to file.' },
                },
                required: ['file_path'],
            },
        },
    },
    handler: (args) => {
        try {
            const filePath = getSafePath(args.file_path);
            if (!fs.existsSync(filePath)) return `Error: File not found at ${args.file_path}`;
            return fs.readFileSync(filePath, 'utf-8');
        } catch (e: any) {
            return `Read Error: ${e.message}`;
        }
    },
};

export const listDirectoryTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'list_directory',
            description: 'List files in a directory.',
            parameters: {
                type: 'object',
                properties: {
                    dir_path: { type: 'string', description: 'Relative directory path.' },
                },
                required: [],
            },
        },
    },
    handler: (args) => {
        try {
            const dirPath = args.dir_path ? getSafePath(args.dir_path) : process.cwd();
            if (!fs.existsSync(dirPath)) return `Error: Directory not found at ${dirPath}`;
            return JSON.stringify(fs.readdirSync(dirPath));
        } catch (e: any) {
            return `List Error: ${e.message}`;
        }
    },
};

export const getCurrentDirectoryTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'get_current_directory',
            description: 'Get the current working directory path.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    handler: () => {
        return process.cwd();
    },
};

export const changeDirectoryTool: Tool = {
    definition: {
        type: 'function',
        function: {
            name: 'change_directory',
            description: 'Change the current working directory.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'The path to change to.' },
                },
                required: ['path'],
            },
        },
    },
    handler: (args) => {
        try {
            const newPath = path.resolve(process.cwd(), args.path);
            if (!fs.existsSync(newPath)) {
                return `Error: Directory not found at ${newPath}`;
            }
            process.chdir(newPath);
            return `Changed directory to: ${process.cwd()}`;
        } catch (e: any) {
            return `Change Directory Error: ${e.message}`;
        }
    },
};
