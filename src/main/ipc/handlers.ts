import { ipcMain } from 'electron';
import * as storage from './storage';
import { checkOllama, generateCompletion, generateChat, pullModel } from './ollama';
import { buildPrompt, buildDatabasePrompt, buildApiPrompt } from './prompts';

let activeAbortController: AbortController | null = null;

export function registerIpcHandlers(): void {
  ipcMain.handle('get-config', () => storage.getConfig());
  ipcMain.handle('save-config', (_e, config) => storage.saveConfig(config));
  ipcMain.handle('set-model', (_e, model: string) => {
    const config = storage.getConfig();
    config.model = model;
    storage.saveConfig(config);
  });

  ipcMain.handle('get-questions', () => storage.getQuestions());
  ipcMain.handle('create-question', (_e, question) => storage.createQuestion(question));
  ipcMain.handle('load-submission', (_e, questionId, submissionId) =>
    storage.loadSubmission(questionId, submissionId)
  );
  ipcMain.handle('save-submission', (_e, questionId, submissionId, canvasConfig) =>
    storage.saveSubmission(questionId, submissionId, canvasConfig)
  );

  ipcMain.handle('get-projects', () => storage.getProjects());
  ipcMain.handle('create-project', (_e, project) => storage.createProject(project));
  ipcMain.handle('load-project', (_e, projectId) => storage.loadProject(projectId));
  ipcMain.handle('save-project', (_e, projectId, canvasConfig) =>
    storage.saveProject(projectId, canvasConfig)
  );

  ipcMain.handle('check-ollama', () => checkOllama());
  ipcMain.handle('pull-model', (_e, modelName: string) => pullModel(modelName));

  ipcMain.handle('process-submission', async (_e, params) => {
    const { designConfig, mode, context, type } = params;
    activeAbortController = new AbortController();
    try {
      const prompt = type === 'database-schema'
        ? buildDatabasePrompt(mode, context, designConfig)
        : type === 'api-design'
        ? buildApiPrompt(mode, context, designConfig)
        : buildPrompt(mode, context, designConfig);
      const rawResponse = await generateCompletion(prompt, activeAbortController.signal);
      const feedback = JSON.parse(rawResponse);
      return { success: true, feedback };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'cancelled' };
      }
      if (error instanceof SyntaxError) {
        return { success: false, error: "This LLM couldn't generate a strict JSON schema, please change the model and try again." };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      activeAbortController = null;
    }
  });

  ipcMain.handle('chat', async (_e, params) => {
    const { message, designConfig } = params;
    activeAbortController = new AbortController();
    try {
      const context = JSON.stringify(designConfig, null, 2);
      const response = await generateChat(message, context, activeAbortController.signal);
      return { success: true, response };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'cancelled' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      activeAbortController = null;
    }
  });
}
