import React, { useState, useEffect, JSX } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
    input: string;
    setInput: (value: string) => void;
    onSubmit: (value: string) => void;
    isThinking: boolean;
}

const COMMANDS = [
    { cmd: '/exit', desc: '退出程序' },
    { cmd: '/clear', desc: '清空对话历史' },
    { cmd: '/help', desc: '显示帮助信息' },
    { cmd: '/cd', desc: '切换工作目录' },
    { cmd: '/simplifier', desc: '整理与简化代码' },
];

export function InputArea({ input, setInput, onSubmit, isThinking }: Props): JSX.Element {
    const [suggestions, setSuggestions] = useState<{ cmd: string; desc: string }[]>([]);

    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        if (input.startsWith('/')) {
            const matches = COMMANDS.filter((c) => c.cmd.startsWith(input));
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    }, [input]);

    const handleInternalSubmit = (value: string) => {
        if (value.trim()) {
            setHistory((prev) => [...prev, value]);
            setHistoryIndex(-1);
            setDraft('');
        }
        onSubmit(value);
    };

    useInput((_input, key) => {
        // Tab Autocomplete
        if (key.tab && suggestions.length > 0) {
            setInput(suggestions[0]!.cmd);
            return;
        }

        // History Navigation: UP
        if (key.upArrow) {
            if (history.length === 0) return;

            const newIndex =
                historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);

            // Save draft if we are starting to move up
            if (historyIndex === -1) {
                setDraft(input);
            }

            setHistoryIndex(newIndex);
            setInput(history[newIndex] || '');
        }

        // History Navigation: DOWN
        if (key.downArrow) {
            if (historyIndex === -1) return; // Already at bottom

            const newIndex = historyIndex + 1;

            if (newIndex >= history.length) {
                // Back to draft
                setHistoryIndex(-1);
                setInput(draft);
            } else {
                setHistoryIndex(newIndex);
                setInput(history[newIndex] || '');
            }
        }
    });

    return (
        <Box flexDirection="column">
            {/* Suggestion Box */}
            {suggestions.length > 0 && (
                <Box
                    flexDirection="column"
                    marginLeft={2}
                    marginBottom={0}
                    borderStyle="single"
                    borderColor="gray"
                >
                    {suggestions.map((s) => (
                        <Box key={s.cmd}>
                            <Text color="yellow" bold>
                                {s.cmd}
                            </Text>
                            <Text color="gray"> - {s.desc}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Input Field */}
            <Box
                marginTop={suggestions.length > 0 ? 0 : 1}
                borderStyle="round"
                borderColor="cyan"
                paddingX={1}
            >
                <Box marginRight={1}>
                    <Text color="cyan" bold>
                        ❯
                    </Text>
                </Box>
                <TextInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleInternalSubmit}
                    placeholder={
                        isThinking ? '思考中...' : "尽管提问... (输入 '/' 查看命令)"
                    }
                />
            </Box>
        </Box>
    );
};
