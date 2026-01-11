import { useState } from 'react';
import { Message } from '../../shared/types.js';
import { parseSSEStream } from '../utils/sse.js';

const API_URL = 'http://localhost:3000/api/chat';
const CONFIRM_URL = 'http://localhost:3000/api/chat/confirm';

interface PendingConfirmation {
    name: string;
    args: any;
    tool_call_id: string;
    tool_call?: any;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useChat() {
    // Initial messages are empty; System Prompt is handled entirely by the server.
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Ready');
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(
        null,
    );

    function clearHistory(): void {
        setMessages([]);
    }

    function addLocalMessage(role: 'assistant' | 'user' | 'log', content: string, meta?: any): void {
        setMessages((prev) => [
            ...prev,
            { id: generateId(), role, content, meta },
        ]);
    }

    async function processStreamResponse(response: Response): Promise<void> {
        let fullContent = '';
        let isConfirmationReceived = false;
        let pendingToolCallData: any = null;

        await parseSSEStream(response, (event) => {
            switch (event.type) {
                case 'content':
                    fullContent += event.data;
                    setCurrentResponse(fullContent);
                    break;
                case 'status':
                    setConnectionStatus(event.data);
                    break;
                case 'error':
                    setCurrentResponse(`Error: ${event.data}`);
                    break;
                case 'confirmation_request':
                    setPendingConfirmation(event.data);
                    isConfirmationReceived = true;
                    pendingToolCallData = event.data.tool_call;
                    setIsThinking(false); // Stop spinner
                    setConnectionStatus('Waiting for Approval');
                    break;
                case 'tool_start':
                    addLocalMessage('log', `🔌 Calling Tool: ${event.data.name}`, event.data);
                    break;
                case 'tool_end':
                    const truncatedResult = event.data.result.length > 100 
                        ? `${event.data.result.substring(0, 100)}...` 
                        : event.data.result;
                    addLocalMessage('log', `✅ Tool Output (${event.data.name}): ${truncatedResult}`, event.data);
                    break;
            }
        });

        // Use local variable to avoid closure staleness
        if (fullContent || isConfirmationReceived) {
            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    role: 'assistant',
                    content: fullContent || '',
                    tool_calls: pendingToolCallData ? [pendingToolCallData] : undefined,
                },
            ]);
            setCurrentResponse('');
        }

        if (!isConfirmationReceived) {
            setIsThinking(false);
            setConnectionStatus('Ready');
        }
    }

    async function fetchWithTimeout(url: string, body: any, signal: AbortSignal): Promise<Response> {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        });
    }

    async function sendMessage(input: string): Promise<void> {
        if (!input.trim() || isThinking) return;

        const userMsg: Message = { id: generateId(), role: 'user', content: input };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setIsThinking(true);
        setCurrentResponse('');
        setConnectionStatus('Connecting...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const body = { messages: updatedMessages.map(({ id, ...rest }) => rest) };
            const response = await fetchWithTimeout(API_URL, body, controller.signal);
            clearTimeout(timeoutId);
            await processStreamResponse(response);
        } catch (error: any) {
            clearTimeout(timeoutId);
            setIsThinking(false);
            setConnectionStatus('Error');
            const errorMessage = error.name === 'AbortError' ? 'Request Timed Out (60s)' : error.message;
            addLocalMessage('assistant', `❌ Connection Error: ${errorMessage}. Is the server running?`);
        }
    }

    async function respondToConfirmation(approved: boolean): Promise<void> {
        if (!pendingConfirmation) return;

        const { name, args, tool_call_id } = pendingConfirmation;
        setPendingConfirmation(null);
        setIsThinking(true);
        setConnectionStatus('Resuming...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const body = {
                messages: messages.map(({ id, ...rest }) => rest),
                toolCallId: tool_call_id,
                toolName: name,
                toolArgs: args,
                approved,
            };
            const response = await fetchWithTimeout(CONFIRM_URL, body, controller.signal);
            clearTimeout(timeoutId);
            await processStreamResponse(response);
        } catch (error: any) {
            clearTimeout(timeoutId);
            setIsThinking(false);
            setConnectionStatus('Error');
            const errorMessage = error.name === 'AbortError' ? 'Resume Request Timed Out (60s)' : error.message;
            addLocalMessage('assistant', `❌ Resume Error: ${errorMessage}`);
        }
    }

    return {
        messages,
        isThinking,
        currentResponse,
        connectionStatus,
        setConnectionStatus,
        sendMessage,
        clearHistory,
        addLocalMessage,
        pendingConfirmation,
        respondToConfirmation,
    };
}
