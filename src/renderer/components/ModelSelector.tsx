import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Download, Loader } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import './ModelSelector.css';

const POPULAR_MODELS = [
  { name: 'gemma4', desc: 'Google, 12B' },
  { name: 'llama3.2', desc: 'Meta, 3B' },
  { name: 'qwen2.5', desc: 'Alibaba, 7B' },
  { name: 'mistral', desc: 'Mistral, 7B' },
  { name: 'phi4', desc: 'Microsoft, 14B' },
  { name: 'deepseek-r1', desc: 'DeepSeek, 7B' },
  { name: 'command-r', desc: 'Cohere, 35B' },
];

export function ModelSelector() {
  const { activeModel, setActiveModel, availableModels, setAvailableModels, ollamaConnected } = useAppStore();
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullPercent, setPullPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!ollamaConnected) return;
    window.api.checkOllama().then((result) => {
      if (result.models) setAvailableModels(result.models);
    });
  }, [ollamaConnected, setAvailableModels]);

  useEffect(() => {
    if (!pulling) return;
    const cleanup = window.api.onPullProgress((data) => {
      if (data.model === pulling) {
        setPullPercent(data.percent);
      }
    });
    return cleanup;
  }, [pulling]);

  const handleSelectModel = (model: string) => {
    setActiveModel(model);
    window.api.setModel(model);
    setOpen(false);
  };

  const handlePull = async (modelName: string) => {
    setPulling(modelName);
    setPullPercent(0);
    setError(null);

    const result = await window.api.pullModel(modelName);
    setPulling(null);

    if (result.success) {
      const check = await window.api.checkOllama();
      if (check.models) setAvailableModels(check.models);
      handleSelectModel(modelName);
    } else {
      setError(result.error || 'Pull failed');
    }
  };

  const handleCustomSubmit = () => {
    const name = customInput.trim();
    if (!name) return;

    const isAvailable = availableModels.some((m) => m === name || m.startsWith(name + ':'));
    if (isAvailable) {
      handleSelectModel(name);
      setCustomInput('');
      return;
    }

    const knownModel = POPULAR_MODELS.find((m) => m.name === name);
    if (knownModel || name.includes('/') || name.includes(':')) {
      handlePull(name);
      setCustomInput('');
      return;
    }

    setError(`Model "${name}" not found. Check the name or use format "model:tag".`);
  };

  const isDownloaded = (model: string) => {
    return availableModels.some((m) => m === model || m.startsWith(model + ':'));
  };

  const displayModel = activeModel.split(':')[0];

  if (!ollamaConnected) return null;

  return (
    <div ref={dropdownRef} className="model-selector">
      <button onClick={() => setOpen(!open)} className="model-selector__trigger">
        {displayModel}
        <ChevronDown size={12} strokeWidth={2} />
      </button>

      {open && (
        <div className="model-selector__dropdown">
          {availableModels.length > 0 && (
            <div className="model-selector__section">
              <div className="model-selector__section-label">Downloaded</div>
              {availableModels.map((model) => (
                <div
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  className="model-selector__item"
                >
                  <div className="model-selector__check">
                    {model === activeModel && <Check size={12} strokeWidth={2.5} color="#2c2c2c" />}
                  </div>
                  <span>{model}</span>
                </div>
              ))}
            </div>
          )}

          <div className="model-selector__section model-selector__section--border">
            <div className="model-selector__section-label">Popular</div>
            {POPULAR_MODELS.filter((m) => !isDownloaded(m.name)).map((model) => (
              <div key={model.name} className="model-selector__popular-item">
                <div>
                  <span>{model.name}</span>
                  <span className="model-selector__popular-desc">{model.desc}</span>
                </div>
                {pulling === model.name ? (
                  <div className="model-selector__pull-progress">
                    <Loader size={11} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                    {pullPercent}%
                  </div>
                ) : (
                  <button
                    onClick={() => handlePull(model.name)}
                    disabled={!!pulling}
                    className="model-selector__pull-btn"
                    title={`Download ${model.name}`}
                  >
                    <Download size={13} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            ))}
            {POPULAR_MODELS.every((m) => isDownloaded(m.name)) && (
              <div className="model-selector__all-installed">All popular models installed</div>
            )}
          </div>

          <div className="model-selector__custom">
            <div className="model-selector__custom-row">
              <input
                value={customInput}
                onChange={(e) => { setCustomInput(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
                placeholder="custom model name..."
                className="model-selector__custom-input"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customInput.trim() || !!pulling}
                className="model-selector__custom-btn"
              >
                use
              </button>
            </div>
          </div>

          {error && (
            <div className="model-selector__error">
              <div className="model-selector__error-title">Model not found</div>
              <div className="model-selector__error-message">{error}</div>
              <button onClick={() => setError(null)} className="model-selector__error-btn">
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
