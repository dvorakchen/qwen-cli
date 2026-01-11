# Qwen CLI

一个基于 **React Ink** 和 **Node.js** 构建的专业终端 AI 助手。本项目采用**客户端-服务器架构**，拥有严格的类型定义和强大的工具调用机制，并内置**人在环路的安全保障**。

## 🌟 核心特性

- **交互式 TUI 界面**：基于 [Ink](https://github.com/vadimdemedes/ink) 构建，支持渐变标题、流式响应和 Markdown 渲染。
- **安全优先**：
    - **人工确认机制**：在执行敏感操作（如 `run_command` 或 `write_file`）前，必须通过交互对话框获得用户的明确批准。
    - **路径沙盒**：文件操作被严格限制在项目目录内，防止越权访问。
- **模块化工具**：工具解耦并独立存放在 `src/server/tools/` 目录下，方便扩展新功能。
- **上下文感知**：AI 能自动检测你的操作系统、Shell 和当前工作目录，以提供准确的命令。

## 📂 项目结构

```text
src/
├── client/                 # TUI 客户端应用
│   ├── components/         # UI 组件
│   │   ├── ConfirmationDialog.tsx # 安全确认对话框
│   │   └── ...
│   ├── hooks/              # 状态管理 (useChat, useServer)
│   └── index.tsx           # 入口文件
├── server/                 # 后端 API 服务器
│   ├── services/           # 核心逻辑
│   │   └── ChatService.ts  # 流处理与中断逻辑
│   └── tools/              # 模块化工具定义
│       ├── filesystem.ts   # 文件 I/O (已沙盒化)
│       ├── shell.ts        # 命令执行 (受保护)
│       └── system.ts       # 信息收集
├── shared/                 # 共享资源
│   ├── config.ts           # 环境配置
│   └── types.ts            # 类型定义 (单一可信源)
└── prompts/                # 系统提示词
```

## 🚀 快速开始

### 前提条件

- Node.js v18+
- DashScope API Key (Qwen) 或兼容 OpenAI 的 API Key。

### 安装

1.  克隆仓库。
2.  安装依赖：
    ```bash
    npm install
    ```
3.  配置环境：
    创建 `.env` 文件：
    ```env
    OPENAI_API_KEY=sk-your-key
    OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
    MODEL_NAME=qwen-max
    PORT=3000
    ```

### 运行

项目支持两种运行方式：

**推荐方式：分步启动（便于调试）**

在两个独立的终端中分别运行：

**终端 1 (后端服务器)**：
```bash
npm run server
```

**终端 2 (前端客户端)**：
```bash
npm run client
```

**快速方式：一键启动**

使用以下命令可直接启动完整应用（自动启动服务器并连接客户端）：
```bash
npm start
```

## 🛡️ 安全模型

### 确认流程

1.  AI 决定执行一个敏感工具（例如 `git init`）。
2.  服务器检测到该工具定义中的 `requiresConfirmation: true`。
3.  服务器**暂停**执行，并发送一个 `confirmation_request` 事件。
4.  客户端拦截此事件，并显示一个**安全警告对话框**。
5.  如果用户选择 **[YES]**：
    - 客户端发送 `POST /api/chat/confirm` 请求。
    - 服务器恢复执行并流式传输结果。
6.  如果用户选择 **[NO]**：
    - 服务器收到拒绝信号，并告知 AI “用户已拒绝此操作”。

## 💻 开发

### 代码风格

本项目使用 **ESLint** 和 **Prettier** 强制统一代码风格。

- **检查**: `npx eslint .`
- **格式化**: `npx prettier --write .`

### 添加新工具

1.  在 `src/server/tools/` 目录下创建一个新文件（例如 `git.ts`）。
2.  定义工具，实现 `Tool` 接口。
3.  导出该工具。
4.  在 `src/server/services/ToolRegistry.ts` 中注册它。
