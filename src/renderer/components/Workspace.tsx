import { useEffect, useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { ResizeHandle } from './ResizeHandle';
import { ModelSelector } from './ModelSelector';
import './Workspace.css';

const LEFT_MIN = 160;
const LEFT_MAX = 360;
const LEFT_DEFAULT = 200;
const RIGHT_MIN = 240;
const RIGHT_MAX = 480;
const RIGHT_DEFAULT = 300;

export function Workspace() {
  const { setView, mode, currentQuestionId, currentSubmissionId, currentProjectId, getCanvasConfig, clearChat, ollamaConnected, setOllamaConnected, setActiveModel, setAvailableModels } = useAppStore();

  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    window.api.checkOllama().then((result) => {
      setOllamaConnected(result.connected);
      if (result.models) setAvailableModels(result.models);
    });
    window.api.getConfig().then((config: any) => {
      if (config?.model) setActiveModel(config.model);
    });
  }, [setOllamaConnected, setAvailableModels, setActiveModel]);

  useEffect(() => {
    const cleanup = window.api.onAppClosing(() => {
      handleSave();
    });
    return cleanup;
  }, []);

  const handleSave = async () => {
    const canvasConfig = getCanvasConfig();
    if (mode === 'practice' && currentQuestionId && currentSubmissionId) {
      await window.api.saveSubmission(currentQuestionId, currentSubmissionId, canvasConfig);
    } else if (mode === 'project' && currentProjectId) {
      await window.api.saveProject(currentProjectId, canvasConfig);
    }
  };

  const handleBack = async () => {
    await handleSave();
    clearChat();
    setView('landing');
  };

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((w) => Math.min(LEFT_MAX, Math.max(LEFT_MIN, w + delta)));
  }, []);

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, w + delta)));
  }, []);

  return (
    <div className="workspace">
      <div className="workspace__header">
        <button onClick={handleBack} className="workspace__back-btn">
          ← back
        </button>

        <div className="workspace__panel-toggles">
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            title={leftCollapsed ? 'Show left panel' : 'Hide left panel'}
            className="workspace__panel-toggle"
          >
            {leftCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            title={rightCollapsed ? 'Show right panel' : 'Hide right panel'}
            className="workspace__panel-toggle"
          >
            {rightCollapsed ? <PanelRightOpen size={16} strokeWidth={1.5} /> : <PanelRightClose size={16} strokeWidth={1.5} />}
          </button>
        </div>

        <div className="workspace__spacer" />
        <div className="workspace__right-controls">
          <ModelSelector />
          <div className="workspace__status">
            <div className={`workspace__status-dot ${ollamaConnected ? 'workspace__status-dot--connected' : 'workspace__status-dot--disconnected'}`} />
            <span>{ollamaConnected ? 'ollama' : 'disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="workspace__body">
        {!leftCollapsed && (
          <>
            <div className="workspace__panel" style={{ width: leftWidth }}>
              <LeftPanel />
            </div>
            <ResizeHandle side="left" onResize={handleLeftResize} />
          </>
        )}

        <Canvas />

        {!rightCollapsed && (
          <>
            <ResizeHandle side="right" onResize={handleRightResize} />
            <div className="workspace__panel" style={{ width: rightWidth }}>
              <RightPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
