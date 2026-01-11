/**
 * @module SharedTypes
 * @description 定义客户端与服务器之间的契约。
 * 此处的所有接口必须保持同步，以确保跨网络边界的类型安全。
 */

/**
 * 表示聊天记录中的单条消息。
 * 镜像 OpenAI 消息格式，但扩展了 UI 特有的字段。
 */
export interface Message {
    /** 消息的唯一标识符（例如时间戳字符串）。 */
    id: string;

    /**
     * 消息发送者的角色。
     * - 'user': 来自人类用户的输入。
     * - 'assistant': 来自 AI 的响应。
     * - 'system': 高层级指令（由服务器注入）。
     * - 'tool': 工具执行的原始输出。
     * - 'log': 仅用于 UI 显示工具执行进度的消息。
     */
    role: 'user' | 'assistant' | 'system' | 'tool' | 'log';

    /** 消息的文本内容。 */
    content: string;

    /** [角色: 'tool'] 此消息所响应的工具调用 ID。 */
    tool_call_id?: string;

    /** [角色: 'tool' | 'log'] 正在执行的工具名称。 */
    name?: string;

    /** [角色: 'assistant'] AI 请求的工具调用数组。 */
    tool_calls?: ToolCall[];

    /** [角色: 'log'] 用于 UI 渲染的任意元数据（例如工具参数或部分结果）。 */
    meta?: any;
}

/**
 * AI 请求的工具调用结构。
 */
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON 字符串
    };
}

/**
 * 工具的 JSON Schema 定义，用于告知 AI 可用的能力。
 */
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}

/**
 * 所有可能的服务器发送事件 (SSE) 的辨别联合类型。
 * 客户端根据 `type` 来决定如何更新 UI。
 */
export type SSEEvent =
    /** 来自 AI 的实时文本流。 */
    | { type: 'content'; data: string }
    /** 状态更新（例如 "Thinking...", "Connecting"）。 */
    | { type: 'status'; data: string }
    /** 需要向用户显示的严重错误。 */
    | { type: 'error'; data: string }
    /** 工具即将运行的通知。 */
    | { type: 'tool_start'; data: { name: string; args: any } }
    /** 工具运行完成的通知。 */
    | { type: 'tool_end'; data: { name: string; result: string } }
    /** 在执行敏感工具之前请求用户批准。 */
    | {
          type: 'confirmation_request';
          data: { name: string; args: any; tool_call_id: string; tool_call?: any };
      }
    /** 系统日志或调试信息。 */
    | { type: 'log'; data: { name: string; content: string } }
    /** 流结束。 */
    | { type: 'done'; data: null };

/**
 * 聊天 UI 的聚合状态对象（可选实用类型）。
 */
export interface ChatState {
    messages: Message[];
    isThinking: boolean;
    currentResponse: string;
    status: string;
}
