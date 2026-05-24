import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Server,
  Database,
  Zap,
  Layers,
  GitFork,
  Globe,
  DoorOpen,
  Monitor,
  HardDrive,
  Link,
  Box,
  Search,
  Bell,
  Radio,
  Workflow,
  Clock,
  Activity,
} from 'lucide-react';
import type { ComponentNodeData } from '../types/schemas';
import { COMPONENT_VARIANTS } from '../components/ComponentDialog';
import './ComponentNode.css';

const NODE_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  service: Server,
  database: Database,
  cache: Zap,
  queue: Layers,
  loadbalancer: GitFork,
  cdn: Globe,
  gateway: DoorOpen,
  client: Monitor,
  storage: HardDrive,
  dns: Link,
  search: Search,
  notification: Bell,
  streaming: Radio,
  pipeline: Workflow,
  scheduler: Clock,
  monitoring: Activity,
  generic: Box,
};

function ComponentNodeComponent({ data, type, selected }: NodeProps) {
  const nodeData = data as ComponentNodeData;
  const nodeType = (type as string) || 'generic';
  const IconComponent = NODE_ICONS[nodeType] || NODE_ICONS.generic;
  const [hovered, setHovered] = useState(false);

  const variantValue = nodeData.properties?.variant;
  const variantLabel = variantValue
    ? COMPONENT_VARIANTS[nodeType]?.find((v) => v.value === variantValue)?.label || variantValue
    : null;

  const description = nodeData.properties?.description;

  return (
    <div
      className={`component-node ${selected ? 'component-node--selected' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#888', width: 7, height: 7 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#888', width: 7, height: 7 }} />
      <div className="component-node__icon">
        <IconComponent size={22} strokeWidth={1.5} />
      </div>
      <div className="component-node__label">
        {nodeData.label}
      </div>
      {variantLabel && (
        <div className="component-node__variant">
          {variantLabel}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#888', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#888', width: 7, height: 7 }} />

      {hovered && description && (
        <div className="component-node__tooltip">
          {description.length > 60 ? description.slice(0, 60) + '…' : description}
        </div>
      )}
    </div>
  );
}

export const ComponentNodeMemo = memo(ComponentNodeComponent);
