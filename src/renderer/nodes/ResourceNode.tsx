import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ResourceNodeData, Endpoint, EndpointParam, HttpMethod } from '../types/schemas';
import { useAppStore } from '../store/appStore';
import './ResourceNode.css';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#16a34a',
  POST: '#2563eb',
  PUT: '#d97706',
  PATCH: '#8b5cf6',
  DELETE: '#dc2626',
};

const PARAM_TYPES = ['string', 'int', 'uuid', 'boolean', 'float', 'object', 'array'];

function ResourceNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as ResourceNodeData;
  const { apiWizardNodes, setApiWizardNodes } = useAppStore();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const endpoints = nodeData.endpoints || [];

  const updateNode = (updatedEndpoints: Endpoint[]) => {
    const updated = apiWizardNodes.map((n) => {
      if (n.id !== id) return n;
      return { ...n, data: { ...n.data, endpoints: updatedEndpoints } };
    });
    setApiWizardNodes(updated as any);
  };

  const handleAddEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: `ep-${Date.now().toString(36)}`,
      method: 'GET',
      path: `/${nodeData.label.toLowerCase()}`,
      description: '',
      params: [],
      responseFields: [],
    };
    updateNode([...endpoints, newEndpoint]);
    setExpandedEndpoint(newEndpoint.id);
  };

  const handleUpdateEndpoint = (epId: string, updates: Partial<Endpoint>) => {
    updateNode(endpoints.map((ep) => (ep.id === epId ? { ...ep, ...updates } : ep)));
  };

  const handleDeleteEndpoint = (epId: string) => {
    updateNode(endpoints.filter((ep) => ep.id !== epId));
    if (expandedEndpoint === epId) setExpandedEndpoint(null);
  };

  const handleAddParam = (epId: string) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    const newParam: EndpointParam = { id: `p-${Date.now().toString(36)}`, name: '', type: 'string', required: false };
    handleUpdateEndpoint(epId, { params: [...ep.params, newParam] });
  };

  const handleUpdateParam = (epId: string, paramId: string, updates: Partial<EndpointParam>) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    handleUpdateEndpoint(epId, { params: ep.params.map((p) => (p.id === paramId ? { ...p, ...updates } : p)) });
  };

  const handleDeleteParam = (epId: string, paramId: string) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    handleUpdateEndpoint(epId, { params: ep.params.filter((p) => p.id !== paramId) });
  };

  const handleAddResponseField = (epId: string) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    const newField: EndpointParam = { id: `r-${Date.now().toString(36)}`, name: '', type: 'string', required: true };
    handleUpdateEndpoint(epId, { responseFields: [...ep.responseFields, newField] });
  };

  const handleUpdateResponseField = (epId: string, fieldId: string, updates: Partial<EndpointParam>) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    handleUpdateEndpoint(epId, { responseFields: ep.responseFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) });
  };

  const handleDeleteResponseField = (epId: string, fieldId: string) => {
    const ep = endpoints.find((e) => e.id === epId);
    if (!ep) return;
    handleUpdateEndpoint(epId, { responseFields: ep.responseFields.filter((f) => f.id !== fieldId) });
  };

  const handleLabelSave = () => {
    setEditingLabel(false);
    if (labelValue.trim() && labelValue !== nodeData.label) {
      const updated = apiWizardNodes.map((n) => {
        if (n.id !== id) return n;
        return { ...n, data: { ...n.data, label: labelValue.trim() } };
      });
      setApiWizardNodes(updated as any);
    } else {
      setLabelValue(nodeData.label);
    }
  };

  return (
    <div className={`resource-node ${selected ? 'resource-node--selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="left" style={{ left: -4, top: 20, width: 7, height: 7, background: '#888', border: '1.5px solid #fff' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ top: -4, width: 7, height: 7, background: '#888', border: '1.5px solid #fff' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ right: -4, top: 20, width: 7, height: 7, background: '#888', border: '1.5px solid #fff' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ bottom: -4, width: 7, height: 7, background: '#888', border: '1.5px solid #fff' }} />

      <div className="resource-node__header">
        {editingLabel ? (
          <input
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') { setLabelValue(nodeData.label); setEditingLabel(false); } }}
            autoFocus
            className="resource-node__label-input"
          />
        ) : (
          <span onDoubleClick={() => setEditingLabel(true)} className="resource-node__label">
            {nodeData.label || 'Resource'}
          </span>
        )}
        <span className="resource-node__endpoint-count">{endpoints.length} endpoints</span>
      </div>

      {endpoints.map((ep) => (
        <div key={ep.id} className="resource-node__endpoint">
          <div
            className="resource-node__endpoint-row"
            onClick={() => setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id)}
          >
            {expandedEndpoint === ep.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <select
              value={ep.method}
              onChange={(e) => { e.stopPropagation(); handleUpdateEndpoint(ep.id, { method: e.target.value as HttpMethod }); }}
              onClick={(e) => e.stopPropagation()}
              className="resource-node__method-select"
              style={{ color: METHOD_COLORS[ep.method] }}
            >
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>
              ))}
            </select>
            <input
              value={ep.path}
              onChange={(e) => handleUpdateEndpoint(ep.id, { path: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="/path"
              className="resource-node__path-input"
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteEndpoint(ep.id); }}
              className="resource-node__delete-btn"
            >
              <X size={10} />
            </button>
          </div>

          {expandedEndpoint === ep.id && (
            <div className="resource-node__endpoint-detail">
              <input
                value={ep.description}
                onChange={(e) => handleUpdateEndpoint(ep.id, { description: e.target.value })}
                placeholder="description"
                className="resource-node__desc-input"
              />

              <div className="resource-node__section-label">params</div>
              {ep.params.map((p) => (
                <div key={p.id} className="resource-node__param-row">
                  <input
                    value={p.name}
                    onChange={(e) => handleUpdateParam(ep.id, p.id, { name: e.target.value })}
                    placeholder="name"
                    className="resource-node__param-name"
                  />
                  <select
                    value={p.type}
                    onChange={(e) => handleUpdateParam(ep.id, p.id, { type: e.target.value })}
                    className="resource-node__param-type"
                  >
                    {PARAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) => handleUpdateParam(ep.id, p.id, { required: e.target.checked })}
                    className="resource-node__param-required"
                    title="Required"
                  />
                  <button onClick={() => handleDeleteParam(ep.id, p.id)} className="resource-node__param-delete">
                    <X size={8} />
                  </button>
                </div>
              ))}
              <button onClick={() => handleAddParam(ep.id)} className="resource-node__add-param-btn">
                <Plus size={8} /> param
              </button>

              <div className="resource-node__section-label resource-node__section-label--response">response</div>
              {ep.responseFields.map((f) => (
                <div key={f.id} className="resource-node__param-row">
                  <input
                    value={f.name}
                    onChange={(e) => handleUpdateResponseField(ep.id, f.id, { name: e.target.value })}
                    placeholder="field"
                    className="resource-node__param-name"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => handleUpdateResponseField(ep.id, f.id, { type: e.target.value })}
                    className="resource-node__param-type"
                  >
                    {PARAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => handleDeleteResponseField(ep.id, f.id)} className="resource-node__param-delete">
                    <X size={8} />
                  </button>
                </div>
              ))}
              <button onClick={() => handleAddResponseField(ep.id)} className="resource-node__add-param-btn">
                <Plus size={8} /> field
              </button>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleAddEndpoint} className="resource-node__add-endpoint-btn">
        <Plus size={10} /> add endpoint
      </button>
    </div>
  );
}

export const ResourceNodeMemo = memo(ResourceNodeComponent);
