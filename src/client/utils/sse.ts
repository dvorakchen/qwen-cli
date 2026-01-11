import { SSEEvent } from '../../shared/types.js';

export async function parseSSEStream(
    response: Response,
    onEvent: (event: SSEEvent) => void,
): Promise<void> {
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                try {
                    const event = JSON.parse(jsonStr) as SSEEvent;
                    onEvent(event);
                } catch (e) {
                    // Ignore parse errors for partial chunks
                }
            }
        }
    }
}
