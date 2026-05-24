import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: unknown) => ipcRenderer.invoke('save-config', config),
  setModel: (model: string) => ipcRenderer.invoke('set-model', model),

  getQuestions: () => ipcRenderer.invoke('get-questions'),
  createQuestion: (question: unknown) => ipcRenderer.invoke('create-question', question),
  loadSubmission: (questionId: string, submissionId: string) =>
    ipcRenderer.invoke('load-submission', questionId, submissionId),
  saveSubmission: (questionId: string, submissionId: string, canvasConfig: unknown) =>
    ipcRenderer.invoke('save-submission', questionId, submissionId, canvasConfig),

  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (project: unknown) => ipcRenderer.invoke('create-project', project),
  loadProject: (projectId: string) => ipcRenderer.invoke('load-project', projectId),
  saveProject: (projectId: string, canvasConfig: unknown) =>
    ipcRenderer.invoke('save-project', projectId, canvasConfig),

  processSubmission: (params: unknown) => ipcRenderer.invoke('process-submission', params),
  chat: (params: unknown) => ipcRenderer.invoke('chat', params),
  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  pullModel: (modelName: string) => ipcRenderer.invoke('pull-model', modelName),

  onPullProgress: (callback: (data: { model: string; percent: number; status: string }) => void) => {
    const handler = (_e: unknown, data: { model: string; percent: number; status: string }) => callback(data);
    ipcRenderer.on('pull-progress', handler);
    return () => ipcRenderer.removeListener('pull-progress', handler);
  },

  onAppClosing: (callback: () => void) => {
    ipcRenderer.on('app-closing', callback);
    return () => ipcRenderer.removeListener('app-closing', callback);
  },
});
