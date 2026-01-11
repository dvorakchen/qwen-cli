import { ToolDefinition } from '../../shared/types.js';
import { getSystemInfoTool } from '../tools/system.js';
import { runCommandTool } from '../tools/shell.js';
import { writeFileTool, readFileTool, listDirectoryTool } from '../tools/filesystem.js';
import { Tool } from '../tools/interface.js';

/**
 * @module ToolRegistry
 * @description Central registry for all tools available to the AI.
 *
 * Aggregates individual tools from the `tools/` directory.
 */

const registry: Record<string, Tool> = {
    [getSystemInfoTool.definition.function.name]: getSystemInfoTool,
    [runCommandTool.definition.function.name]: runCommandTool,
    [writeFileTool.definition.function.name]: writeFileTool,
    [readFileTool.definition.function.name]: readFileTool,
    [listDirectoryTool.definition.function.name]: listDirectoryTool,
};

export const TOOLS: ToolDefinition[] = Object.values(registry).map((t) => t.definition);

export function getTool(name: string): Tool | undefined {
    return registry[name];
}

export async function executeTool(name: string, args: any): Promise<string> {
    console.log(`[ToolRegistry] Executing ${name}`);

    const tool = registry[name];
    if (!tool) {
        return `Error: Unknown tool '${name}'`;
    }

    try {
        // Ensure result is always a string and handle both sync/async
        const result = await tool.handler(args);
        return String(result);
    } catch (error: any) {
        return `Tool Execution Error: ${error.message}`;
    }
}
