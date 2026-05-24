import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import './AnnotationNode.css';

function AnnotationNodeComponent({ data }: NodeProps) {
  const nodeData = data as { label: string };
  return (
    <div className="annotation-node">
      {nodeData.label}
    </div>
  );
}

export const AnnotationNodeMemo = memo(AnnotationNodeComponent);
