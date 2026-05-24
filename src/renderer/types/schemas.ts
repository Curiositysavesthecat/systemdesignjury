import type { Node, Edge, Viewport } from '@xyflow/react';

export type FeedbackMode = 'suggestions' | 'critique' | 'youwillregretthis';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ComponentProperties {
  variant?: string;
  [key: string]: string | undefined;
}

export interface ComponentNodeData {
  label: string;
  properties: ComponentProperties;
  [key: string]: unknown;
}

export type ComponentNode = Node<ComponentNodeData>;

export interface CanvasConfig {
  id: string;
  questionId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  viewport: Viewport;
  nodes: ComponentNode[];
  edges: Edge[];
  chatHistory?: ChatMessage[];
}

export interface DesignComponent {
  id: string;
  type: string;
  label: string;
  properties: ComponentProperties;
  variant?: string;
  description?: string;
}

export interface DesignConnection {
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  direction: 'unidirectional' | 'bidirectional';
}

export interface DesignConfig {
  id: string;
  questionId?: string;
  projectId?: string;
  components: DesignComponent[];
  connections: DesignConnection[];
}

export interface ComponentFeedback {
  componentId: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface SuggestedComponent {
  type: string;
  label: string;
  reason: string;
}

export interface FeedbackResponse {
  mode: FeedbackMode;
  submissionId: string;
  timestamp: string;
  overall?: {
    score: number;
    summary: string;
    strengths: string[];
    gaps: string[];
  };
  componentFeedback: ComponentFeedback[];
  suggestedComponents: SuggestedComponent[];
}

export interface Question {
  id: string;
  title: string;
  description: string;
  functionalRequirements: string;
  nonFunctionalRequirements?: string;
  expectedComponents?: string[];
  evaluationCriteria?: string[];
  submissions: string[];
  difficulty: Difficulty;
  tags: string[];
}

export interface QuestionsIndex {
  questions: Question[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsIndex {
  projects: Project[];
}

export interface AppConfig {
  ollamaUrl: string;
  model: string;
  dataDir: string;
}

export type AppView = 'landing' | 'workspace' | 'database-wizard' | 'api-wizard';

export type ColumnType = 'pk' | 'fk' | 'text' | 'int' | 'float' | 'boolean' | 'datetime' | 'json' | 'uuid';

export interface EntityColumn {
  id: string;
  name: string;
  type: ColumnType;
  isIndexed: boolean;
}

export interface EntityNodeData {
  label: string;
  columns: EntityColumn[];
  [key: string]: unknown;
}

export interface DatabaseWizardState {
  nodes: Node<EntityNodeData>[];
  edges: Edge[];
  viewport: Viewport;
}

export interface DatabaseDesignEntity {
  id: string;
  name: string;
  columns: { name: string; type: ColumnType; isIndexed: boolean }[];
}

export interface DatabaseDesignRelationship {
  sourceEntity: string;
  sourceColumn: string;
  targetEntity: string;
  targetColumn: string;
}

export interface DatabaseDesignConfig {
  parentNodeId: string;
  parentNodeLabel: string;
  variant?: string;
  entities: DatabaseDesignEntity[];
  relationships: DatabaseDesignRelationship[];
}
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointParam {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  params: EndpointParam[];
  responseFields: EndpointParam[];
}

export interface ResourceNodeData {
  label: string;
  endpoints: Endpoint[];
  [key: string]: unknown;
}

export interface ApiWizardState {
  nodes: Node<ResourceNodeData>[];
  edges: Edge[];
  viewport: Viewport;
}

export interface ApiDesignEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
  params: { name: string; type: string; required: boolean }[];
  responseFields: { name: string; type: string }[];
}

export interface ApiDesignResource {
  id: string;
  name: string;
  endpoints: ApiDesignEndpoint[];
}

export interface ApiDesignDependency {
  sourceResource: string;
  targetResource: string;
}

export interface ApiDesignConfig {
  parentNodeId: string;
  parentNodeLabel: string;
  variant?: string;
  resources: ApiDesignResource[];
  dependencies: ApiDesignDependency[];
}

export type AppMode = 'practice' | 'project';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type: 'chat' | 'feedback';
  feedback?: FeedbackResponse;
}
