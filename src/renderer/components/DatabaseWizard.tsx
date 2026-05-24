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
import { Table2, ArrowLeft } from 'lucide-react';
import { wizardNodeTypes } from '../nodes';
import { useAppStore } from '../store/appStore';
import { RightPanel } from './RightPanel';
import { ResizeHandle } from './ResizeHandle';
import { ModelSelector } from './ModelSelector';
import type { EntityNodeData } from '../types/schemas';
import './DatabaseWizard.css';

const RIGHT_MIN = 240;
const RIGHT_MAX = 480;
const RIGHT_DEFAULT = 300;

export function DatabaseWizard() {
  const {
    wizardNodes, wizardEdges, wizardTargetNodeId, nodes,
    setWizardNodes, setWizardEdges, setWizardViewport,
    exitDatabaseWizard, ollamaConnected, setOllamaConnected, setAvailableModels, setActiveModel,
    highlightedNodeId, setHighlightedNodeId,
  } = useAppStore();

  const reactFlowInstance = useRef<any>(null);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const parentNode = nodes.find((n) => n.id === wizardTargetNodeId);
  const parentLabel = (parentNode?.data as any)?.label || 'Database';

  useEffect(() => {
    if (!highlightedNodeId) return;
    const currentNodes = useAppStore.getState().wizardNodes;
    const target = currentNodes.find((n) => n.id === highlightedNodeId);
    if (!target) return;

    setWizardNodes(currentNodes.map((n) => ({ ...n, selected: n.id === highlightedNodeId })) as any);

    if (reactFlowInstance.current) {
      const x = target.position.x + ((target.measured?.width || 220) / 2);
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
      useAppStore.getState().saveWizardToNode();
    });
    return cleanup;
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setWizardNodes(applyNodeChanges(changes, useAppStore.getState().wizardNodes) as any);
    },
    [setWizardNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setWizardEdges(applyEdgeChanges(changes, useAppStore.getState().wizardEdges));
    },
    [setWizardEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const state = useAppStore.getState();
      const { source, sourceHandle, target, targetHandle } = connection;

      const sourceNode = state.wizardNodes.find((n) => n.id === source);
      const targetNode = state.wizardNodes.find((n) => n.id === target);
      if (!sourceNode || !targetNode) return;

      const sourceColId = sourceHandle?.replace(/-(?:left|right)$/, '') || '';
      const targetColId = targetHandle?.replace(/-(?:left|right)$/, '') || '';

      const sourceData = sourceNode.data as EntityNodeData;
      const targetData = targetNode.data as EntityNodeData;
      const sourceCol = sourceData.columns.find((c) => c.id === sourceColId);
      const targetCol = targetData.columns.find((c) => c.id === targetColId);

      if (sourceCol?.type !== 'fk' || targetCol?.type !== 'pk') return;

      const exists = state.wizardEdges.some(
        (e) => e.source === source && e.sourceHandle?.replace(/-(?:left|right)$/, '') === sourceColId &&
               e.target === target && e.targetHandle?.replace(/-(?:left|right)$/, '') === targetColId
      );
      if (exists) return;

      setWizardEdges(addEdge({ ...connection, type: 'smoothstep', animated: true, style: { stroke: '#d97706' } }, state.wizardEdges));
    },
    [setWizardEdges]
  );

  const isValidConnection = useCallback((connection: any) => {
    const state = useAppStore.getState();
    const sourceNode = state.wizardNodes.find((n) => n.id === connection.source);
    const targetNode = state.wizardNodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourceColId = connection.sourceHandle?.replace(/-(?:left|right)$/, '') || '';
    const targetColId = connection.targetHandle?.replace(/-(?:left|right)$/, '') || '';

    const sourceData = sourceNode.data as EntityNodeData;
    const targetData = targetNode.data as EntityNodeData;
    const sourceCol = sourceData.columns.find((c: any) => c.id === sourceColId);
    const targetCol = targetData.columns.find((c: any) => c.id === targetColId);

    return sourceCol?.type === 'fk' && targetCol?.type === 'pk';
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type');
      if (type !== 'entity' || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode = {
        id: `entity-${Date.now().toString(36)}`,
        type: 'entity',
        position,
        data: { label: 'Entity', columns: [] } as EntityNodeData,
        selected: false,
      };
      setWizardNodes([...useAppStore.getState().wizardNodes, newNode] as any);
    },
    [setWizardNodes]
  );

  const onInit = useCallback((instance: unknown) => {
    reactFlowInstance.current = instance;
  }, []);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setWizardViewport(viewport);
    },
    [setWizardViewport]
  );

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, w + delta)));
  }, []);

  const handleBack = () => {
    const state = useAppStore.getState();
    state.saveWizardToNode();

    if (state.wizardNodes.length > 0) {
      const config = state.getWizardDesignConfig();
      if (config && config.entities.some((e) => e.columns.length > 0)) {
        const prompt = `Summarize this database schema in 2-3 concise sentences describing the entities, their relationships, and the data model's purpose. Do not use bullet points or formatting.\n\nSchema: ${JSON.stringify(config)}\n\nRespond with only the summary.`;
        const designConfig = state.getDesignConfig();
        window.api.chat({ message: prompt, designConfig }).then((result) => {
          if (result.success && result.response) {
            const currentNodes = useAppStore.getState().nodes;
            const updated = currentNodes.map((n) => {
              if (n.id !== state.wizardTargetNodeId) return n;
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

    exitDatabaseWizard();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow-type', 'entity');
    e.dataTransfer.setData('application/reactflow-label', 'Entity');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="db-wizard">
      <div className="db-wizard__header">
        <button onClick={handleBack} className="db-wizard__back-btn">
          <ArrowLeft size={14} strokeWidth={1.8} /> back to canvas
        </button>
        <div className="db-wizard__title">
          <span className="db-wizard__title-name">{parentLabel}</span>
          <span className="db-wizard__title-label">schema wizard</span>
        </div>
        <div className="db-wizard__spacer" />
        <div className="db-wizard__right-controls">
          <ModelSelector />
          <div className="db-wizard__status">
            <div className={`db-wizard__status-dot ${ollamaConnected ? 'db-wizard__status-dot--connected' : 'db-wizard__status-dot--disconnected'}`} />
            <span>{ollamaConnected ? 'ollama' : 'disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="db-wizard__body">
        <div className="db-wizard__left-panel">
          <div className="db-wizard__components-label">Components</div>
          <div
            draggable
            onDragStart={handleDragStart}
            className="db-wizard__drag-item"
          >
            <Table2 size={14} strokeWidth={1.5} />
            Entity
          </div>
          <div className="db-wizard__hint">
            Drag to add entities. Connect FK → PK columns to define relationships.
          </div>
        </div>

        <div className="db-wizard__canvas">
          <ReactFlow
            nodes={wizardNodes}
            edges={wizardEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onMoveEnd={onMoveEnd}
            nodeTypes={wizardNodeTypes}
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
            <div className="db-wizard__panel" style={{ width: rightWidth }}>
              <RightPanel wizardMode="database" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
