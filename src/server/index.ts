/**
 * @module ServerEntry
 * @description The main entry point for the Backend API Server.
 *
 * Responsibilities:
 * - Initializes the Express application.
 * - Configures Middleware (CORS, JSON parsing).
 * - Defines HTTP Routes.
 * - Delegates business logic to specific Services (e.g., ChatService).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { CONFIG } from '../shared/config.js';
import { ChatService } from './services/ChatService.js';

const app = express();
const chatService = new ChatService();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async function handleChat(req, res) {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }
    await chatService.handleChatStream(res, messages);
});

app.post('/api/chat/confirm', async function handleChatConfirm(req, res) {
    const { messages, toolCallId, toolName, toolArgs, approved } = req.body;

    if (!messages || !toolCallId || !toolName) {
        return res.status(400).json({ error: 'Missing required confirmation parameters' });
    }

    await chatService.runToolAndContinue(res, messages, toolCallId, toolName, toolArgs, approved);
});

import path from 'path';
import fs from 'fs';

app.get('/api/cwd', function getCwd(req, res) {
    res.json({ cwd: process.cwd() });
});

app.post('/api/cwd', function setCwd(req, res) {
    const { path: targetPath } = req.body;
    if (!targetPath || typeof targetPath !== 'string') {
        return res.status(400).json({ error: 'Path is required' });
    }

    try {
        const resolvedPath = path.resolve(process.cwd(), targetPath);
        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ error: 'Directory does not exist' });
        }
        if (!fs.statSync(resolvedPath).isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }

        process.chdir(resolvedPath);
        res.json({ cwd: process.cwd() });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(CONFIG.SERVER.PORT, function onServerStart() {
    console.log(`Backend server running on ${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`);
});
