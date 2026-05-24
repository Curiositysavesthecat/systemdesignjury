import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Globe, ArrowLeft } from 'lucide-react';
import { apiWizardNodeTypes } from '../nodes';
import { useAppStore } from '../store/appStore';
import { RightPanel } from './RightPanel';
import { ResizeHandle } from './ResizeHandle';
import { ModelSelector } from './ModelSelector';
import type { ResourceNodeData } from '../types/schemas';
import './ApiWizard.css';

const RIGHT_MIN = 240;
const RIGHT_MAX = 480;
const RIGHT_DEFAULT = 300;

export function ApiWizard() {
  const {
    apiWizardNodes, apiWizardEdges, apiWizardTargetNodeId, nodes,
    setApiWizardNodes, setApiWizardEdges, setApiWizardViewport,
    exitApiWizard, ollamaConnected, setOllamaConnected, setAvailableModels, setActiveModel,
    highlightedNodeId, setHighlightedNodeId,
  } = useAppStore();

  const reactFlowInstance = useRef<any>(null);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const parentNode = nodes.find((n) => n.id === apiWizardTargetNodeId);
  const parentLabel = (parentNode?.data as any)?.label || 'Service';

  useEffect(() => {
    if (!highlightedNodeId) return;
    const currentNodes = useAppStore.getState().apiWizardNodes;
    const target = currentNodes.find((n) => n.id === highlightedNodeId);
    if (!target) return;

    setApiWizardNodes(currentNodes.map((n) => ({ ...n, selected: n.id === highlightedNodeId })) as any);

    if (reactFlowInstance.current) {
      const x = target.position.x + ((target.measured?.width || 260) / 2);
      const y = target.position.y + ((target.measured?.height || 100) / 2);
      reactFlowInstance.current.setCenter(x, y, { zoom: 1.2, duration: 400 });
    }

    const timer = setTimeout(() => setHighlightedNodeId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedNodeId]);

  useEffect(() => {
    window.api.checkOllama().then((result) => {
      setOllamaConnected(result.connected);
      if (result.models) setAvailableModels(result.models);
    });
    window.api.getConfig().then((config: any) => {
      if (config?.model) setActiveModel(config.model);
    });
  }, []);

  useEffect(() => {
    const cleanup = window.api.onAppClosing(() => {
      useAppStore.getState().saveApiWizardToNode();
    });
    return cleanup;
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setApiWizardNodes(applyNodeChanges(changes, useAppStore.getState().apiWizardNodes) as any);
    },
    [setApiWizardNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setApiWizardEdges(applyEdgeChanges(changes, useAppStore.getState().apiWizardEdges));
    },
    [setApiWizardEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setApiWizardEdges(addEdge({ ...connection, type: 'smoothstep', animated: true, style: { stroke: '#2563eb' } }, useAppStore.getState().apiWizardEdges));
    },
    [setApiWizardEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type');
      if (type !== 'resource' || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode = {
        id: `resource-${Date.now().toString(36)}`,
        type: 'resource',
        position,
        data: { label: 'Resource', endpoints: [] } as ResourceNodeData,
        selected: false,
      };
      setApiWizardNodes([...useAppStore.getState().apiWizardNodes, newNode] as any);
    },
    [setApiWizardNodes]
  );

  const onInit = useCallback((instance: unknown) => {
    reactFlowInstance.current = instance;
  }, []);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setApiWizardViewport(viewport);
    },
    [setApiWizardViewport]
  );

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, w + delta)));
  }, []);

  const handleBack = () => {
    const state = useAppStore.getState();
    state.saveApiWizardToNode();

    if (state.apiWizardNodes.length > 0) {
      const config = state.getApiWizardDesignConfig();
      if (config && config.resources.some((r) => r.endpoints.length > 0)) {
        const prompt = `Summarize this REST API design in 2-3 concise sentences describing the resources, their endpoints, and the API's purpose. Do not use bullet points or formatting.\n\nAPI Design: ${JSON.stringify(config)}\n\nRespond with only the summary.`;
        const designConfig = state.getDesignConfig();
        window.api.chat({ message: prompt, designConfig }).then((result) => {
          if (result.success && result.response) {
            const currentNodes = useAppStore.getState().nodes;
            const updated = currentNodes.map((n) => {
              if (n.id !== state.apiWizardTargetNodeId) return n;
              return {
                ...n,
                data: { ...n.data, properties: { ...(n.data as any).properties, description: result.response } },
              };
            });
            useAppStore.getState().setNodes(updated as any);
          }
        });
      }
    }

    exitApiWizard();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow-type', 'resource');
    e.dataTransfer.setData('application/reactflow-label', 'Resource');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="api-wizard">
      <div className="api-wizard__header">
        <button onClick={handleBack} className="api-wizard__back-btn">
          <ArrowLeft size={14} strokeWidth={1.8} /> back to canvas
        </button>
        <div className="api-wizard__title">
          <span className="api-wizard__title-name">{parentLabel}</span>
          <span className="api-wizard__title-label">api wizard</span>
        </div>
        <div className="api-wizard__spacer" />
        <div className="api-wizard__right-controls">
          <ModelSelector />
          <div className="api-wizard__status">
            <div className={`api-wizard__status-dot ${ollamaConnected ? 'api-wizard__status-dot--connected' : 'api-wizard__status-dot--disconnected'}`} />
            <span>{ollamaConnected ? 'ollama' : 'disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="api-wizard__body">
        <div className="api-wizard__left-panel">
          <div className="api-wizard__components-label">Components</div>
          <div
            draggable
            onDragStart={handleDragStart}
            className="api-wizard__drag-item"
          >
            <Globe size={14} strokeWidth={1.5} />
            Resource
          </div>
          <div className="api-wizard__hint">
            Drag to add resources. Connect resources to show dependencies between them.
          </div>
        </div>

        <div className="api-wizard__canvas">
          <ReactFlow
            nodes={apiWizardNodes}
            edges={apiWizardEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMoveEnd={onMoveEnd}
            nodeTypes={apiWizardNodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {!rightCollapsed && (
          <>
            <ResizeHandle side="right" onResize={handleRightResize} />
            <div className="api-wizard__panel" style={{ width: rightWidth }}>
              <RightPanel wizardMode="api" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
