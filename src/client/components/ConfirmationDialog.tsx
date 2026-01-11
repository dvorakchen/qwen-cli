import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ConfirmationDialogProps {
    toolName: string;
    args: any;
    onConfirm: (approved: boolean) => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    toolName,
    args,
    onConfirm,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0); // 0 = No, 1 = Yes (Default to No for safety)

    useInput((input, key) => {
        if (key.leftArrow || key.rightArrow) {
            setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
        }
        if (key.return) {
            onConfirm(selectedIndex === 1);
        }
    });

    return (
        <Box
            flexDirection="column"
            borderStyle="double"
            borderColor="yellow"
            padding={1}
            marginTop={1}
        >
            <Text bold color="yellow">
                ⚠️ SECURITY ALERT
            </Text>
            <Text>The AI wants to execute a sensitive command:</Text>

            <Box marginY={1} flexDirection="column">
                <Text color="cyan" bold>
                    Tool: {toolName}
                </Text>
                <Text color="gray">{JSON.stringify(args, null, 2)}</Text>
            </Box>

            <Text>Do you want to proceed?</Text>

            <Box marginTop={1}>
                <Box marginRight={2}>
                    <Text
                        color={selectedIndex === 0 ? 'white' : 'gray'}
                        backgroundColor={selectedIndex === 0 ? 'red' : undefined}
                    >
                        [ NO ]
                    </Text>
                </Box>
                <Box>
                    <Text
                        color={selectedIndex === 1 ? 'white' : 'gray'}
                        backgroundColor={selectedIndex === 1 ? 'green' : undefined}
                    >
                        [ YES ]
                    </Text>
                </Box>
            </Box>

            <Text dimColor>Use Arrow Keys to select, Enter to confirm.</Text>
        </Box>
    );
};
