import { getUserConfig } from './user-config.js';

const userConfig = getUserConfig();

export const CONFIG = {
    SERVER: {
        PORT: process.env.PORT || 3000,
        HOST: 'http://localhost',
        REFACTOR_THRESHOLD: 5,
    },
    API: {
        BASE_URL:
            process.env.OPENAI_BASE_URL ||
            userConfig.OPENAI_BASE_URL ||
            'https://dashscope.aliyuncs.com/compatible-mode/v1',
        MODEL_NAME: process.env.MODEL_NAME || userConfig.MODEL_NAME || 'qwen-max',
    },
    CLIENT: {
        API_ENDPOINT: 'http://localhost:3000/api/chat',
    },
};
