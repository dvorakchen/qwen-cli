import OpenAI from 'openai';
import { Response } from 'express';
import { CONFIG } from '../../shared/config.js';
import { TOOLS, executeTool, getTool } from './ToolRegistry.js';
import { Message, SSEEvent } from '../../shared/types.js';
import { getSystemPrompt } from '../../prompts/system.js';
import { getCodeSimplifierPrompt } from '../../prompts/code-simplifier.js';
import { getUserConfig } from '../../shared/user-config.js';

/**
 * @class ChatService
 * @description Manages the lifecycle of AI chat sessions.
 */
export class ChatService {
    private openai: OpenAI;

    constructor() {
        const userConfig = getUserConfig();
        const apiKey = process.env.OPENAI_API_KEY || userConfig.OPENAI_API_KEY || 'sk-placeholder';
        
        this.openai = new OpenAI({
            apiKey,
            baseURL: CONFIG.API.BASE_URL,
        });
    }

    private sendEvent(res: Response, event: SSEEvent) {
        res.write(`data: ${JSON.stringify(event)}

`);
    }

    public async runToolAndContinue(
        res: Response,
        messages: Message[],
        toolCallId: string,
        toolName: string,
        toolArgs: any,
        approved: boolean,
    ) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            let result = '';

            if (approved) {
                this.sendEvent(res, {
                    type: 'tool_start',
                    data: { name: toolName, args: toolArgs },
                });

                result = await executeTool(toolName, toolArgs);

                this.sendEvent(res, {
                    type: 'tool_end',
                    data: { name: toolName, result },
                });
            } else {
                result = 'User rejected this action.';
            }

            const updatedMessages = [
                ...messages,
                {
                    role: 'tool',
                    tool_call_id: toolCallId,
                    name: toolName,
                    content: result,
                } as Message,
            ];

            await this.handleChatStream(res, updatedMessages, true);
        } catch (error: any) {
            console.error('Resume Error:', error);
            this.sendEvent(res, { type: 'error', data: error.message });
            res.end();
        }
    }

    public async handleChatStream(res: Response, messages: Message[], isResuming = false): Promise<void> {
        if (!isResuming) {
            this.setSSEHeaders(res);
        }

        try {
            let currentMessages = this.prepareMessages(messages, isResuming);
            let keepGoing = true;

            while (keepGoing) {
                keepGoing = false;
                const apiMessages = currentMessages.filter((m) => m.role !== 'log');

                const stream = await this.openai.chat.completions.create({
                    model: CONFIG.API.MODEL_NAME,
                    messages: apiMessages as any,
                    tools: TOOLS as any,
                    stream: true,
                });

                const toolCallBuffer = await this.streamResponse(res, stream);

                if (toolCallBuffer) {
                    const toolName = toolCallBuffer.function.name;
                    const toolArgs = JSON.parse(toolCallBuffer.function.arguments || '{}');
                    const toolDef = getTool(toolName);

                    if (toolDef?.requiresConfirmation) {
                        this.requestConfirmation(res, toolCallBuffer, toolName, toolArgs);
                        return;
                    }

                    await this.executeAndLogTool(res, currentMessages, toolCallBuffer, toolName, toolArgs);
                    
                    this.sendEvent(res, { type: 'status', data: 'Thinking...' });
                    keepGoing = true;
                }
            }

            this.sendEvent(res, { type: 'done', data: null });
            res.end();
        } catch (error: any) {
            console.error('Chat Error:', error);
            this.sendEvent(res, { type: 'error', data: error.message });
            res.end();
        }
    }

    private setSSEHeaders(res: Response): void {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    }

    private prepareMessages(messages: Message[], isResuming: boolean): Message[] {
        if (isResuming) return messages;

        // Manual Simplifier Trigger: Check if the last user message is the specific command
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user' && lastMsg.content.trim() === '/simplifier') {
            lastMsg.content = getCodeSimplifierPrompt();
        }

        const systemMessage: Message = {
            id: 'system',
            role: 'system',
            content: getSystemPrompt(),
        };
        const userMessages = messages.filter((m) => m.role !== 'system');
        return [systemMessage, ...userMessages];
    }

    private async streamResponse(res: Response, stream: any): Promise<any | null> {
        let toolCallBuffer: any = null;

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
                this.sendEvent(res, { type: 'content', data: delta.content });
            }

            if (delta?.tool_calls) {
                const toolChunk = delta.tool_calls[0];
                if (toolChunk) {
                    if (!toolCallBuffer) {
                        toolCallBuffer = {
                            index: toolChunk.index,
                            id: toolChunk.id,
                            type: 'function',
                            function: {
                                name: toolChunk.function?.name || '',
                                arguments: '',
                            },
                        };
                    }
                    if (toolChunk.function?.name) {
                        toolCallBuffer.function.name = toolChunk.function.name;
                    }
                    if (toolChunk.function?.arguments) {
                        toolCallBuffer.function.arguments += toolChunk.function.arguments;
                    }
                }
            }
        }
        return toolCallBuffer;
    }

    private requestConfirmation(res: Response, toolCallBuffer: any, toolName: string, toolArgs: any): void {
        this.sendEvent(res, {
            type: 'confirmation_request',
            data: {
                name: toolName,
                args: toolArgs,
                tool_call_id: toolCallBuffer.id,
                tool_call: toolCallBuffer,
            },
        });
        this.sendEvent(res, { type: 'done', data: null });
        res.end();
    }

    private async executeAndLogTool(
        res: Response,
        currentMessages: Message[],
        toolCallBuffer: any,
        toolName: string,
        toolArgs: any,
    ): Promise<void> {
        this.sendEvent(res, {
            type: 'tool_start',
            data: { name: toolName, args: toolArgs },
        });

        currentMessages.push({
            role: 'assistant',
            tool_calls: [toolCallBuffer],
        } as any);

        const result = await executeTool(toolName, toolArgs);

        this.sendEvent(res, {
            type: 'tool_end',
            data: { name: toolName, result },
        });

        currentMessages.push({
            role: 'tool',
            tool_call_id: toolCallBuffer.id,
            name: toolName,
            content: result,
        } as any);
    }
}
