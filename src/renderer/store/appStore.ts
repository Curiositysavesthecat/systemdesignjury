import { create } from 'zustand';
import type { Node, Edge, Viewport } from '@xyflow/react';
import type {
  AppView,
  AppMode,
  FeedbackMode,
  FeedbackResponse,
  ChatMessage,
  Question,
  Project,
  CanvasConfig,
  DesignConfig,
  ComponentNodeData,
  EntityNodeData,
  DatabaseWizardState,
  DatabaseDesignConfig,
  ResourceNodeData,
  ApiWizardState,
  ApiDesignConfig,
} from '../types/schemas';

interface AppState {
  currentView: AppView;
  mode: AppMode | null;
  feedbackMode: FeedbackMode;

  nodes: Node<ComponentNodeData>[];
  edges: Edge[];
  viewport: Viewport;

  currentQuestionId: string | null;
  currentSubmissionId: string | null;
  currentProjectId: string | null;

  questions: Question[];
  projects: Project[];

  chatMessages: ChatMessage[];
  isLoading: boolean;
  ollamaConnected: boolean;

  lastFeedback: FeedbackResponse | null;
  highlightedNodeId: string | null;

  activeModel: string;
  availableModels: string[];
  setActiveModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;

  // Database wizard
  wizardTargetNodeId: string | null;
  wizardNodes: Node<EntityNodeData>[];
  wizardEdges: Edge[];
  wizardViewport: Viewport;

  // API wizard
  apiWizardTargetNodeId: string | null;
  apiWizardNodes: Node<ResourceNodeData>[];
  apiWizardEdges: Edge[];
  apiWizardViewport: Viewport;

  setView: (view: AppView) => void;
  setMode: (mode: AppMode) => void;
  setFeedbackMode: (mode: FeedbackMode) => void;

  setNodes: (nodes: Node<ComponentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;

  setCurrentQuestion: (questionId: string, submissionId: string) => void;
  setCurrentProject: (projectId: string) => void;

  setQuestions: (questions: Question[]) => void;
  setProjects: (projects: Project[]) => void;

  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  clearChat: () => void;
  setIsLoading: (loading: boolean) => void;
  setOllamaConnected: (connected: boolean) => void;

  setLastFeedback: (feedback: FeedbackResponse | null) => void;
  setHighlightedNodeId: (id: string | null) => void;

  // Wizard actions
  setWizardNodes: (nodes: Node<EntityNodeData>[]) => void;
  setWizardEdges: (edges: Edge[]) => void;
  setWizardViewport: (viewport: Viewport) => void;
  enterDatabaseWizard: (nodeId: string) => void;
  exitDatabaseWizard: () => void;
  saveWizardToNode: () => void;
  getWizardDesignConfig: () => DatabaseDesignConfig | null;
  updateEntityColumns: (nodeId: string, columns: EntityNodeData['columns']) => void;

  // API wizard actions
  setApiWizardNodes: (nodes: Node<ResourceNodeData>[]) => void;
  setApiWizardEdges: (edges: Edge[]) => void;
  setApiWizardViewport: (viewport: Viewport) => void;
  enterApiWizard: (nodeId: string) => void;
  exitApiWizard: () => void;
  saveApiWizardToNode: () => void;
  getApiWizardDesignConfig: () => ApiDesignConfig | null;

  getCanvasConfig: () => CanvasConfig;
  getDesignConfig: () => DesignConfig;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'landing',
  mode: null,
  feedbackMode: 'critique',

  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  currentQuestionId: null,
  currentSubmissionId: null,
  currentProjectId: null,

  questions: [],
  projects: [],

  chatMessages: [],
  isLoading: false,
  ollamaConnected: false,

  lastFeedback: null,
  highlightedNodeId: null,

  activeModel: 'gemma4',
  availableModels: [],
  setActiveModel: (activeModel) => set({ activeModel }),
  setAvailableModels: (availableModels) => set({ availableModels }),

  // Database wizard
  wizardTargetNodeId: null,
  wizardNodes: [],
  wizardEdges: [],
  wizardViewport: { x: 0, y: 0, zoom: 1 },

  // API wizard
  apiWizardTargetNodeId: null,
  apiWizardNodes: [],
  apiWizardEdges: [],
  apiWizardViewport: { x: 0, y: 0, zoom: 1 },

  setView: (view) => set({ currentView: view }),
  setMode: (mode) => set({ mode }),
  setFeedbackMode: (feedbackMode) => set({ feedbackMode }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setViewport: (viewport) => set({ viewport }),

  setCurrentQuestion: (questionId, submissionId) =>
    set({ currentQuestionId: questionId, currentSubmissionId: submissionId }),
  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

  setQuestions: (questions) => set({ questions }),
  setProjects: (projects) => set({ projects }),

  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  clearChat: () => set({ chatMessages: [] }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setOllamaConnected: (ollamaConnected) => set({ ollamaConnected }),

  setLastFeedback: (lastFeedback) => set({ lastFeedback }),
  setHighlightedNodeId: (highlightedNodeId) => set({ highlightedNodeId }),

  // Wizard actions
  setWizardNodes: (wizardNodes) => set({ wizardNodes }),
  setWizardEdges: (wizardEdges) => set({ wizardEdges }),
  setWizardViewport: (wizardViewport) => set({ wizardViewport }),

  enterDatabaseWizard: (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const wizardState = (node.data as any).wizardState as DatabaseWizardState | undefined;
    set({
      wizardTargetNodeId: nodeId,
      wizardNodes: wizardState?.nodes || [],
      wizardEdges: wizardState?.edges || [],
      wizardViewport: wizardState?.viewport || { x: 0, y: 0, zoom: 1 },
      currentView: 'database-wizard',
      chatMessages: [],
    });
  },

  exitDatabaseWizard: () => {
    const state = get();
    state.saveWizardToNode();
    set({
      currentView: 'workspace',
      wizardTargetNodeId: null,
      wizardNodes: [],
      wizardEdges: [],
      wizardViewport: { x: 0, y: 0, zoom: 1 },
      chatMessages: [],
    });
  },

  saveWizardToNode: () => {
    const state = get();
    if (!state.wizardTargetNodeId) return;
    const wizardState: DatabaseWizardState = {
      nodes: state.wizardNodes,
      edges: state.wizardEdges,
      viewport: state.wizardViewport,
    };
    const updatedNodes = state.nodes.map((n) => {
      if (n.id !== state.wizardTargetNodeId) return n;
      return {
        ...n,
        data: { ...n.data, wizardState },
      };
    });
    set({ nodes: updatedNodes as any });
  },

  getWizardDesignConfig: () => {
    const state = get();
    if (!state.wizardTargetNodeId) return null;
    const parentNode = state.nodes.find((n) => n.id === state.wizardTargetNodeId);
    if (!parentNode) return null;
    const parentData = parentNode.data as ComponentNodeData;

    const entities = state.wizardNodes.map((n) => {
      const data = n.data as EntityNodeData;
      return {
        id: n.id,
        name: data.label,
        columns: data.columns.map((c) => ({
          name: c.name,
          type: c.type,
          isIndexed: c.isIndexed,
        })),
      };
    });

    const relationships = state.wizardEdges.map((edge) => {
      const sourceNode = state.wizardNodes.find((n) => n.id === edge.source);
      const targetNode = state.wizardNodes.find((n) => n.id === edge.target);
      const sourceData = sourceNode?.data as EntityNodeData | undefined;
      const targetData = targetNode?.data as EntityNodeData | undefined;
      const srcColId = (edge.sourceHandle || '').replace(/-(?:left|right)$/, '');
      const tgtColId = (edge.targetHandle || '').replace(/-(?:left|right)$/, '');
      const sourceCol = sourceData?.columns.find((c) => c.id === srcColId);
      const targetCol = targetData?.columns.find((c) => c.id === tgtColId);
      return {
        sourceEntity: sourceData?.label || edge.source,
        sourceColumn: sourceCol?.name || srcColId,
        targetEntity: targetData?.label || edge.target,
        targetColumn: targetCol?.name || tgtColId,
      };
    });

    return {
      parentNodeId: state.wizardTargetNodeId,
      parentNodeLabel: parentData.label,
      variant: parentData.properties?.variant,
      entities,
      relationships,
    };
  },

  updateEntityColumns: (nodeId, columns) => {
    const state = get();
    const removedColumnIds = new Set<string>();
    const existingNode = state.wizardNodes.find((n) => n.id === nodeId);
    if (existingNode) {
      const existingData = existingNode.data as EntityNodeData;
      const newIds = new Set(columns.map((c) => c.id));
      for (const col of existingData.columns) {
        if (!newIds.has(col.id)) removedColumnIds.add(col.id);
      }
    }

    const updatedNodes = state.wizardNodes.map((n) => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, columns } };
    });

    let updatedEdges = state.wizardEdges;
    if (removedColumnIds.size > 0) {
      updatedEdges = updatedEdges.filter((e) => {
        const srcColId = (e.sourceHandle || '').replace(/-(?:left|right)$/, '');
        const tgtColId = (e.targetHandle || '').replace(/-(?:left|right)$/, '');
        if (e.source === nodeId && removedColumnIds.has(srcColId)) return false;
        if (e.target === nodeId && removedColumnIds.has(tgtColId)) return false;
        return true;
      });
    }

    set({ wizardNodes: updatedNodes as any, wizardEdges: updatedEdges });
  },

  // API wizard actions
  setApiWizardNodes: (apiWizardNodes) => set({ apiWizardNodes }),
  setApiWizardEdges: (apiWizardEdges) => set({ apiWizardEdges }),
  setApiWizardViewport: (apiWizardViewport) => set({ apiWizardViewport }),

  enterApiWizard: (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const wizardState = (node.data as any).apiWizardState as ApiWizardState | undefined;
    set({
      apiWizardTargetNodeId: nodeId,
      apiWizardNodes: wizardState?.nodes || [],
      apiWizardEdges: wizardState?.edges || [],
      apiWizardViewport: wizardState?.viewport || { x: 0, y: 0, zoom: 1 },
      currentView: 'api-wizard',
      chatMessages: [],
    });
  },

  exitApiWizard: () => {
    const state = get();
    state.saveApiWizardToNode();
    set({
      currentView: 'workspace',
      apiWizardTargetNodeId: null,
      apiWizardNodes: [],
      apiWizardEdges: [],
      apiWizardViewport: { x: 0, y: 0, zoom: 1 },
      chatMessages: [],
    });
  },

  saveApiWizardToNode: () => {
    const state = get();
    if (!state.apiWizardTargetNodeId) return;
    const wizardState: ApiWizardState = {
      nodes: state.apiWizardNodes,
      edges: state.apiWizardEdges,
      viewport: state.apiWizardViewport,
    };
    const updatedNodes = state.nodes.map((n) => {
      if (n.id !== state.apiWizardTargetNodeId) return n;
      return {
        ...n,
        data: { ...n.data, apiWizardState: wizardState },
      };
    });
    set({ nodes: updatedNodes as any });
  },

  getApiWizardDesignConfig: () => {
    const state = get();
    if (!state.apiWizardTargetNodeId) return null;
    const parentNode = state.nodes.find((n) => n.id === state.apiWizardTargetNodeId);
    if (!parentNode) return null;
    const parentData = parentNode.data as ComponentNodeData;

    const resources = state.apiWizardNodes.map((n) => {
      const data = n.data as ResourceNodeData;
      return {
        id: n.id,
        name: data.label,
        endpoints: data.endpoints.map((ep) => ({
          method: ep.method,
          path: ep.path,
          description: ep.description,
          params: ep.params.map((p) => ({ name: p.name, type: p.type, required: p.required })),
          responseFields: ep.responseFields.map((f) => ({ name: f.name, type: f.type })),
        })),
      };
    });

    const dependencies = state.apiWizardEdges.map((edge) => {
      const sourceNode = state.apiWizardNodes.find((n) => n.id === edge.source);
      const targetNode = state.apiWizardNodes.find((n) => n.id === edge.target);
      const sourceData = sourceNode?.data as ResourceNodeData | undefined;
      const targetData = targetNode?.data as ResourceNodeData | undefined;
      return {
        sourceResource: sourceData?.label || edge.source,
        targetResource: targetData?.label || edge.target,
      };
    });

    return {
      parentNodeId: state.apiWizardTargetNodeId,
      parentNodeLabel: parentData.label,
      variant: parentData.properties?.variant,
      resources,
      dependencies,
    };
  },

  getCanvasConfig: () => {
    const state = get();
    const recentMessages = state.chatMessages.slice(-10);
    return {
      id: state.currentSubmissionId || state.currentProjectId || 'untitled',
      questionId: state.currentQuestionId || undefined,
      projectId: state.currentProjectId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport: state.viewport,
      nodes: state.nodes,
      edges: state.edges,
      chatHistory: recentMessages.length > 0 ? recentMessages : undefined,
    };
  },

  getDesignConfig: () => {
    const state = get();
    return {
      id: state.currentSubmissionId || state.currentProjectId || 'untitled',
      questionId: state.currentQuestionId || undefined,
      projectId: state.currentProjectId || undefined,
      components: state.nodes.map((node) => {
        const data = node.data as ComponentNodeData;
        const props = data?.properties || {};
        return {
          id: node.id,
          type: node.type || 'generic',
          label: data?.label || '',
          properties: props,
          variant: props.variant || undefined,
          description: props.description || undefined,
        };
      }),
      connections: state.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
        protocol: (edge.data as { protocol?: string })?.protocol,
        direction: ((edge.data as { direction?: string })?.direction as 'unidirectional' | 'bidirectional') || 'unidirectional',
      })),
    };
  },
}));
