import React, { JSX } from 'react';
import { Box, Text, Static } from 'ink';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { Message } from '../../shared/types.js';

interface Props {
    messages: Message[];
}

function getRoleLabel(role: string): string {
    switch (role) {
        case 'user': return '❯ User: ';
        case 'tool': return '⚙️ Tool: ';
        case 'assistant': return '🤖 Qwen: ';
        default: return '';
    }
}

function getRoleColor(role: string): string {
    switch (role) {
        case 'user': return 'green';
        case 'tool': return 'yellow';
        case 'assistant': return 'blue';
        default: return 'white';
    }
}

export function MessageList({ messages }: Props): JSX.Element {
    const visibleMessages = messages.filter((m) => m.role !== 'system');

    return (
        <Box flexDirection="column">
            <Static items={visibleMessages}>
                {function renderMessage(msg) {
                    const isLog = msg.role === 'log';
                    
                    return (
                        <Box
                            key={msg.id}
                            flexDirection="column"
                            marginBottom={isLog ? 0 : 1}
                        >
                            <Box>
                                {isLog ? (
                                    <Text color="gray" dimColor>
                                        {' '}
                                        {msg.content}
                                    </Text>
                                ) : (
                                    <Box flexDirection="column">
                                        <Text color={getRoleColor(msg.role)} bold>
                                            {getRoleLabel(msg.role)}
                                        </Text>
                                        <Box marginLeft={2}>
                                            <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                }}
            </Static>
        </Box>
    );
}
