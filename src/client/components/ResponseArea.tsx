import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { MarkdownRenderer } from './MarkdownRenderer.js';

interface Props {
    isThinking: boolean;
    currentResponse: string;
    status: string;
}

export const ResponseArea: React.FC<Props> = ({ isThinking, currentResponse, status }) => {
    if (!isThinking) return null;

    return (
        <Box marginBottom={1} flexDirection="column">
            <Text color="blue" bold>
                🤖 Qwen:{' '}
            </Text>
            {currentResponse ? (
                <Box marginLeft={2}>
                    <MarkdownRenderer>{currentResponse}</MarkdownRenderer>
                </Box>
            ) : (
                <Text color="yellow">
                    <Spinner type="dots" /> {status}
                </Text>
            )}
        </Box>
    );
};
