import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_DATA_DIR = path.join(os.homedir(), '.systemdesignjury');

interface AppConfig {
  ollamaUrl: string;
  model: string;
  dataDir: string;
}

function getDataDir(): string {
  const configPath = path.join(DEFAULT_DATA_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.dataDir || DEFAULT_DATA_DIR;
  }
  return DEFAULT_DATA_DIR;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureDataStructure(): void {
  const dataDir = getDataDir();
  ensureDir(dataDir);
  ensureDir(path.join(dataDir, 'questions'));
  ensureDir(path.join(dataDir, 'projects'));

  const configPath = path.join(dataDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    const defaultConfig: AppConfig = {
      ollamaUrl: 'http://localhost:11434',
      model: 'gemma4',
      dataDir: DEFAULT_DATA_DIR,
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  const questionsIndex = path.join(dataDir, 'questions', 'index.json');
  if (!fs.existsSync(questionsIndex)) {
    fs.writeFileSync(questionsIndex, JSON.stringify({ questions: [] }, null, 2));
  }

  const projectsIndex = path.join(dataDir, 'projects', 'index.json');
  if (!fs.existsSync(projectsIndex)) {
    fs.writeFileSync(projectsIndex, JSON.stringify({ projects: [] }, null, 2));
  }
}

export function getConfig(): AppConfig {
  ensureDataStructure();
  const configPath = path.join(getDataDir(), 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export function saveConfig(config: AppConfig): void {
  ensureDataStructure();
  const configPath = path.join(getDataDir(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getQuestions(): unknown {
  ensureDataStructure();
  const indexPath = path.join(getDataDir(), 'questions', 'index.json');
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

export function createQuestion(question: { id: string; title: string; description?: string; functionalRequirements: string; nonFunctionalRequirements?: string; expectedComponents?: string[]; evaluationCriteria?: string[]; difficulty?: string; tags?: string[] }): void {
  ensureDataStructure();
  const dataDir = getDataDir();
  const indexPath = path.join(dataDir, 'questions', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  const questionDir = path.join(dataDir, 'questions', question.id);
  ensureDir(questionDir);

  const questionFile = {
    id: question.id,
    title: question.title,
    description: question.description || '',
    functionalRequirements: question.functionalRequirements,
    nonFunctionalRequirements: question.nonFunctionalRequirements || '',
    expectedComponents: question.expectedComponents || [],
    evaluationCriteria: question.evaluationCriteria || [],
    submissions: [],
    difficulty: question.difficulty || 'medium',
    tags: question.tags || [],
  };
  fs.writeFileSync(path.join(questionDir, 'question.json'), JSON.stringify(questionFile, null, 2));

  index.questions.push(questionFile);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function loadSubmission(questionId: string, submissionId: string): unknown | null {
  const filePath = path.join(getDataDir(), 'questions', questionId, `${submissionId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveSubmission(questionId: string, submissionId: string, canvasConfig: unknown): void {
  ensureDataStructure();
  const dataDir = getDataDir();
  const questionDir = path.join(dataDir, 'questions', questionId);
  ensureDir(questionDir);

  fs.writeFileSync(path.join(questionDir, `${submissionId}.json`), JSON.stringify(canvasConfig, null, 2));

  const indexPath = path.join(dataDir, 'questions', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const q = index.questions.find((q: { id: string }) => q.id === questionId);
  if (q && !q.submissions.includes(submissionId)) {
    q.submissions.push(submissionId);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
}

export function getProjects(): unknown {
  ensureDataStructure();
  const indexPath = path.join(getDataDir(), 'projects', 'index.json');
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

export function createProject(project: { id: string; name: string; description?: string }): void {
  ensureDataStructure();
  const dataDir = getDataDir();
  const indexPath = path.join(dataDir, 'projects', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  const projectDir = path.join(dataDir, 'projects', project.id);
  ensureDir(projectDir);

  const projectFile = {
    id: project.id,
    name: project.name,
    description: project.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(projectFile, null, 2));

  index.projects.push(projectFile);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function loadProject(projectId: string): unknown | null {
  const filePath = path.join(getDataDir(), 'projects', projectId, 'diagram.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function saveProject(projectId: string, canvasConfig: unknown): void {
  ensureDataStructure();
  const projectDir = path.join(getDataDir(), 'projects', projectId);
  ensureDir(projectDir);
  fs.writeFileSync(path.join(projectDir, 'diagram.json'), JSON.stringify(canvasConfig, null, 2));

  const indexPath = path.join(getDataDir(), 'projects', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const p = index.projects.find((p: { id: string }) => p.id === projectId);
  if (p) {
    p.updatedAt = new Date().toISOString();
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
}
