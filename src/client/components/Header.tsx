import React, { JSX } from 'react';
import { Box } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

export function Header(): JSX.Element {
    return (
        <Box flexDirection="column" alignItems="flex-start">
            <Gradient name="morning">
                <BigText text="QWEN CLI" font="block" align="center" />
            </Gradient>
        </Box>
    );
}
