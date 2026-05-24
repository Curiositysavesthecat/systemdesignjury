import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, X } from 'lucide-react';
import type { EntityNodeData, EntityColumn, ColumnType } from '../types/schemas';
import { useAppStore } from '../store/appStore';
import './EntityNode.css';

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'pk', label: 'PK' },
  { value: 'fk', label: 'FK' },
  { value: 'text', label: 'Text' },
  { value: 'int', label: 'Int' },
  { value: 'float', label: 'Float' },
  { value: 'boolean', label: 'Bool' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'json', label: 'JSON' },
  { value: 'uuid', label: 'UUID' },
];

function EntityNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as EntityNodeData;
  const updateEntityColumns = useAppStore((s) => s.updateEntityColumns);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label);

  const columns = nodeData.columns || [];

  const handleAddColumn = () => {
    const newCol: EntityColumn = {
      id: `col-${Date.now().toString(36)}`,
      name: '',
      type: 'text',
      isIndexed: false,
    };
    updateEntityColumns(id, [...columns, newCol]);
  };

  const handleUpdateColumn = (colId: string, updates: Partial<EntityColumn>) => {
    updateEntityColumns(id, columns.map((c) => (c.id === colId ? { ...c, ...updates } : c)));
  };

  const handleDeleteColumn = (colId: string) => {
    updateEntityColumns(id, columns.filter((c) => c.id !== colId));
  };

  const handleLabelSave = () => {
    setEditingLabel(false);
    if (labelValue.trim() && labelValue !== nodeData.label) {
      const state = useAppStore.getState();
      const updated = state.wizardNodes.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, label: labelValue.trim() } };
      });
      state.setWizardNodes(updated as any);
    } else {
      setLabelValue(nodeData.label);
    }
  };

  return (
    <div className={`entity-node ${selected ? 'entity-node--selected' : ''}`}>
      <div className="entity-node__header">
        {editingLabel ? (
          <input
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') { setLabelValue(nodeData.label); setEditingLabel(false); } }}
            autoFocus
            className="entity-node__label-input"
          />
        ) : (
          <span onDoubleClick={() => setEditingLabel(true)} className="entity-node__label">
            {nodeData.label || 'Entity'}
          </span>
        )}
      </div>

      {columns.length > 0 && (
        <div className="entity-node__columns-header">
          <span className="entity-node__columns-header-name">Name</span>
          <span className="entity-node__columns-header-type">Type</span>
          <span className="entity-node__columns-header-idx">Idx</span>
          <span className="entity-node__columns-header-del" />
        </div>
      )}

      {columns.map((col) => (
        <div key={col.id} className="entity-node__column">
          {col.type === 'pk' && (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.id}-left`}
                style={{ left: -4, top: '50%', width: 7, height: 7, background: '#16a34a', border: '1.5px solid #fff' }}
              />
              <Handle
                type="target"
                position={Position.Right}
                id={`${col.id}-right`}
                style={{ right: -4, top: '50%', width: 7, height: 7, background: '#16a34a', border: '1.5px solid #fff' }}
              />
            </>
          )}
          {col.type === 'fk' && (
            <>
              <Handle
                type="source"
                position={Position.Left}
                id={`${col.id}-left`}
                style={{ left: -4, top: '50%', width: 7, height: 7, background: '#d97706', border: '1.5px solid #fff' }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.id}-right`}
                style={{ right: -4, top: '50%', width: 7, height: 7, background: '#d97706', border: '1.5px solid #fff' }}
              />
            </>
          )}

          <input
            value={col.name}
            onChange={(e) => handleUpdateColumn(col.id, { name: e.target.value })}
            placeholder="column"
            className="entity-node__col-name"
          />
          <select
            value={col.type}
            onChange={(e) => handleUpdateColumn(col.id, { type: e.target.value as ColumnType })}
            className={`entity-node__col-type entity-node__col-type--${col.type === 'pk' ? 'pk' : col.type === 'fk' ? 'fk' : 'default'}`}
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="checkbox"
            checked={col.isIndexed}
            onChange={(e) => handleUpdateColumn(col.id, { isIndexed: e.target.checked })}
            className="entity-node__col-index"
            title="Indexed"
          />
          <button
            onClick={() => handleDeleteColumn(col.id)}
            className="entity-node__col-delete"
          >
            <X size={10} />
          </button>
        </div>
      ))}

      <button onClick={handleAddColumn} className="entity-node__add-btn">
        <Plus size={10} /> add column
      </button>
    </div>
  );
}

export const EntityNodeMemo = memo(EntityNodeComponent);
