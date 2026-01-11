import { ToolDefinition } from '../../shared/types.js';

export interface Tool {
    definition: ToolDefinition;
    handler: (args: any) => string | Promise<string>;
    requiresConfirmation?: boolean;
}
