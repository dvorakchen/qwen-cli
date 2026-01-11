import React, { useMemo } from 'react';
import { Text } from 'ink';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Configure marked with terminal renderer (works in marked v4)
marked.setOptions({
    renderer: new TerminalRenderer({
        width: 80,
        reflowText: true,
        showSectionPrefix: false,
        unescape: true,
        emoji: true,
    }),
});

interface Props {
    children: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ children }) => {
    const output = useMemo(() => {
        try {
            // marked v4 is synchronous by default
            return marked(children);
        } catch (e) {
            return children;
        }
    }, [children]);

    return <Text>{output}</Text>;
};
