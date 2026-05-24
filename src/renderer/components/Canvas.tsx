import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../nodes';
import { useAppStore } from '../store/appStore';
import { ComponentDialog, COMPONENT_VARIANTS } from './ComponentDialog';
import type { ComponentNodeData } from '../types/schemas';

interface PendingDrop {
  type: string;
  label: string;
  position: { x: number; y: number };
}

interface EditingNode {
  id: string;
  type: string;
  label: string;
  variant: string;
  description: string;
}

export function Canvas() {
  const { nodes, edges, setNodes, setEdges, setViewport, highlightedNodeId, setHighlightedNodeId } = useAppStore();
  const reactFlowInstance = useRef<any>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);

  useEffect(() => {
    if (!highlightedNodeId) return;
    const currentNodes = useAppStore.getState().nodes;
    const target = currentNodes.find((n) => n.id === highlightedNodeId);
    if (!target) return;

    setNodes(currentNodes.map((n) => ({ ...n, selected: n.id === highlightedNodeId })) as any);

    if (reactFlowInstance.current) {
      const x = target.position.x + ((target.measured?.width || 140) / 2);
      const y = target.position.y + ((target.measured?.height || 70) / 2);
      reactFlowInstance.current.setCenter(x, y, { zoom: 1.2, duration: 400 });
    }

    const timer = setTimeout(() => setHighlightedNodeId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightedNodeId]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, useAppStore.getState().nodes) as any);
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, useAppStore.getState().edges));
    },
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges(addEdge({ ...connection, type: 'smoothstep', animated: true }, useAppStore.getState().edges));
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type');
      const label = e.dataTransfer.getData('application/reactflow-label');
      if (!type || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      if (type === 'annotation') {
        const newNode = {
          id: `comp-${Date.now().toString(36)}`,
          type,
          position,
          data: { label: 'Note', properties: {} },
          selected: false,
        };
        setNodes([...useAppStore.getState().nodes, newNode]);
      } else if (COMPONENT_VARIANTS[type]) {
        setPendingDrop({ type, label, position });
      } else {
        const newNode = {
          id: `comp-${Date.now().toString(36)}`,
          type,
          position,
          data: { label, properties: {} },
          selected: false,
        };
        setNodes([...useAppStore.getState().nodes, newNode]);
      }
    },
    [setNodes]
  );

  const handleDialogConfirm = (variant: string, description: string, label: string) => {
    if (!pendingDrop) return;
    const newNode = {
      id: `comp-${Date.now().toString(36)}`,
      type: pendingDrop.type,
      position: pendingDrop.position,
      data: {
        label,
        properties: {
          variant,
          ...(description ? { description } : {}),
        },
      },
      selected: false,
    };
    setNodes([...useAppStore.getState().nodes, newNode]);
    setPendingDrop(null);
  };

  const handleDialogCancel = () => {
    if (!pendingDrop) return;
    const newNode = {
      id: `comp-${Date.now().toString(36)}`,
      type: pendingDrop.type,
      position: pendingDrop.position,
      data: {
        label: pendingDrop.label,
        properties: {},
      },
      selected: false,
    };
    setNodes([...useAppStore.getState().nodes, newNode]);
    setPendingDrop(null);
  };

  const handleEditConfirm = (variant: string, description: string, label: string) => {
    if (!editingNode) return;
    const currentNodes = useAppStore.getState().nodes;
    setNodes(currentNodes.map((n) => {
      if (n.id !== editingNode.id) return n;
      return {
        ...n,
        data: {
          ...(n.data as ComponentNodeData),
          label,
          properties: {
            variant,
            ...(description ? { description } : {}),
          },
        },
      };
    }) as any);
    setEditingNode(null);
  };

  const handleEditCancel = () => {
    setEditingNode(null);
  };

  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    const nodeType = node.type || 'generic';
    if (nodeType === 'annotation') return;
    const data = node.data as ComponentNodeData;
    setEditingNode({
      id: node.id,
      type: nodeType,
      label: data.label || '',
      variant: data.properties?.variant || '',
      description: data.properties?.description || '',
    });
  }, []);

  const onInit = useCallback((instance: unknown) => {
    reactFlowInstance.current = instance;
  }, []);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const onNodeClick = useCallback((_: unknown, node: { id: string }) => {
    if (highlightedNodeId && node.id === highlightedNodeId) {
      setHighlightedNodeId(null);
    }
  }, [highlightedNodeId, setHighlightedNodeId]);

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMoveEnd={onMoveEnd}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {pendingDrop && (
        <ComponentDialog
          componentType={pendingDrop.type}
          componentLabel={pendingDrop.label}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      )}

      {editingNode && (
        <ComponentDialog
          componentType={editingNode.type}
          componentLabel={editingNode.label}
          initialVariant={editingNode.variant}
          initialDescription={editingNode.description}
          onConfirm={handleEditConfirm}
          onCancel={handleEditCancel}
          isEdit
          onOpenWizard={(editingNode.type === 'database' || editingNode.type === 'service') ? () => {
            const nodeId = editingNode.id;
            const nodeType = editingNode.type;
            setEditingNode(null);
            if (nodeType === 'database') {
              useAppStore.getState().enterDatabaseWizard(nodeId);
            } else {
              useAppStore.getState().enterApiWizard(nodeId);
            }
          } : undefined}
        />
      )}
    </div>
  );
}
