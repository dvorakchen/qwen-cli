/**
 * @module ClientEntry
 * @description The main entry point for the React Ink TUI Application.
 *
 * Hierarchy:
 * - QwenCLI (Root Component)
 *   - Header
 *   - MessageList (Renders chat history)
 *   - ResponseArea (Renders streaming active response)
 *   - InputArea (Handles user input & history)
 *   - Footer (Status bar)
 */

import 'dotenv/config';
import React, { JSX, useState } from 'react';
import { render, Box, useApp } from 'ink';
import { useServer } from './hooks/useServer.js';
import { useChat } from './hooks/useChat.js';
import { Header } from './components/Header.js';
import { MessageList } from './components/MessageList.js';
import { ResponseArea } from './components/ResponseArea.js';
import { InputArea } from './components/InputArea.js';
import { Footer } from './components/Footer.js';
import { ConfirmationDialog } from './components/ConfirmationDialog.js';

import { CONFIG } from '../shared/config.js';

export function QwenCLI(): JSX.Element {
    const { exit } = useApp();
    const [input, setInput] = useState('');

    // Custom Hooks
    const { status: serverStatus, currentPath, changeDirectory } = useServer();
    const {
        messages,
        isThinking,
        currentResponse,
        connectionStatus,
        sendMessage,
        clearHistory,
        addLocalMessage,
        pendingConfirmation,
        respondToConfirmation,
    } = useChat();

    const handleSubmit = async (value: string) => {
        if (!value.trim()) return;

        if (value.startsWith('/cd ')) {
            const target = value.substring(4).trim();
            addLocalMessage('user', value);
            
            const result = await changeDirectory(target);
            if (result.success) {
                addLocalMessage('log', `✅ 已切换目录至: ${target}`);
            } else {
                addLocalMessage('log', `❌ 切换目录失败: ${result.message}`);
            }
            setInput('');
            return;
        }

        if (value === '/clear') {
            clearHistory();
            setInput('');
            return;
        }

        if (value === '/help') {
            addLocalMessage('user', '/help');
            addLocalMessage(
                'assistant',
                `
可用命令:
- /help: 显示此帮助信息。
- /clear: 清空对话历史和上下文。
- /exit: 退出程序。
- /cd <路径>: 切换当前工作目录。
- /simplifier: 触发代码整理与简化。

功能特性:
- 与 Qwen-max 模型进行实时对话。
- 工具调用: AI 可以读取/写入文件并运行 Shell 命令。
- 上下文感知: AI 了解您的操作系统和当前工作目录。
            `.trim(),
            );
            setInput('');
            return;
        }

        if (value === '/exit') {
            exit();
            // Fallback: force exit if cleanup hangs
            setTimeout(() => process.exit(0), 500);
            return;
        }

        sendMessage(value);
        setInput('');
    };

    return (
        <Box flexDirection="column" padding={1}>
            {!isThinking && <Header />}
            <MessageList messages={messages} />

            <ResponseArea
                isThinking={isThinking}
                currentResponse={currentResponse}
                status={connectionStatus}
            />

            {pendingConfirmation ? (
                <ConfirmationDialog
                    toolName={pendingConfirmation.name}
                    args={pendingConfirmation.args}
                    onConfirm={respondToConfirmation}
                />
            ) : (
                <InputArea
                    input={input}
                    setInput={setInput}
                    onSubmit={handleSubmit}
                    isThinking={isThinking}
                />
            )}

            <Footer
                serverUrl={CONFIG.CLIENT.API_ENDPOINT}
                status={`${connectionStatus} | ${serverStatus}`}
                currentPath={currentPath}
            />
        </Box>
    );
};

render(<QwenCLI />);
