import { getConfig } from './storage';
import { BrowserWindow } from 'electron';

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

export async function checkOllama(): Promise<{ connected: boolean; models?: string[] }> {
  const config = getConfig();
  try {
    const response = await fetch(`${config.ollamaUrl}/api/tags`);
    if (!response.ok) return { connected: false };
    const data = await response.json() as { models?: { name: string }[] };
    return { connected: true, models: data.models?.map((m) => m.name) || [] };
  } catch {
    return { connected: false };
  }
}

export async function pullModel(modelName: string): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  try {
    const response = await fetch(`${config.ollamaUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text || `HTTP ${response.status}` };
    }

    const reader = response.body?.getReader();
    if (!reader) return { success: false, error: 'No response body' };

    const decoder = new TextDecoder();
    const win = BrowserWindow.getFocusedWindow();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as { status?: string; total?: number; completed?: number; error?: string };
          if (data.error) {
            return { success: false, error: data.error };
          }
          if (win && data.total && data.completed) {
            const percent = Math.round((data.completed / data.total) * 100);
            win.webContents.send('pull-progress', { model: modelName, percent, status: data.status });
          }
        } catch {}
      }
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function generateCompletion(prompt: string, signal?: AbortSignal): Promise<string> {
  const config = getConfig();
  const response = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      format: 'json',
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as OllamaGenerateResponse;
  return data.response;
}

export async function generateChat(message: string, context: string, signal?: AbortSignal): Promise<string> {
  const config = getConfig();
  const response = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt: `You are a helpful system design mentor. The user is working on an architecture diagram. Here is their current design:\n\n${context}\n\nUser question: ${message}\n\nRespond helpfully and concisely.`,
      stream: false,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as OllamaGenerateResponse;
  return data.response;
}
