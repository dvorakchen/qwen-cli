import React from 'react';
import { Box, Text } from 'ink';

interface Props {
    serverUrl: string;
    status: string;
    currentPath?: string;
}

export function Footer({ serverUrl, status, currentPath }: Props): JSX.Element {
    return (
        <Box marginTop={1} flexDirection="column">
            <Box justifyContent="space-between">
                <Text color="gray" dimColor>
                    [Server: {serverUrl}] [Ctrl+C to exit]
                </Text>
                <Text color="gray" dimColor>
                    Status: {status}
                </Text>
            </Box>
            {currentPath && (
                <Box borderStyle="single" borderColor="gray" paddingX={1}>
                    <Text>📂 {currentPath}</Text>
                </Box>
            )}
        </Box>
    );
}
