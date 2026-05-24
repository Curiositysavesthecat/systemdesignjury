import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '../store/appStore';
import type { FeedbackMode, FeedbackResponse } from '../types/schemas';
import './RightPanel.css';

function FeedbackCard({ feedback, wizardMode }: { feedback: FeedbackResponse; wizardMode?: 'database' | 'api' | boolean }) {
  const { setHighlightedNodeId } = useAppStore();

  return (
    <div className="feedback-card">
      {feedback.overall && (
        <>
          <div className="feedback-card__score">
            <span className="feedback-card__score-value">
              {feedback.overall.score}
            </span>
            <span className="feedback-card__score-max">/ 10</span>
          </div>
          <p className="feedback-card__summary">{feedback.overall.summary}</p>

          {feedback.overall.strengths?.length > 0 && (
            <div className="feedback-card__section">
              <div className="feedback-card__section-label">strengths</div>
              {feedback.overall.strengths.map((s, i) => (
                <div key={i} className="feedback-card__item">+ {s}</div>
              ))}
            </div>
          )}

          {feedback.overall.gaps?.length > 0 && (
            <div className="feedback-card__section">
              <div className="feedback-card__section-label">gaps</div>
              {feedback.overall.gaps.map((g, i) => (
                <div key={i} className="feedback-card__item">- {g}</div>
              ))}
            </div>
          )}
        </>
      )}

      {feedback.componentFeedback?.length > 0 && (
        <div className="feedback-card__section">
          <div className="feedback-card__section-label feedback-card__section-label--suggested">component feedback</div>
          {feedback.componentFeedback.map((cf, i) => (
            <div
              key={i}
              onClick={() => setHighlightedNodeId(cf.componentId)}
              className={`feedback-card__component-item feedback-card__component-item--${cf.severity === 'error' ? 'error' : cf.severity === 'warning' ? 'warning' : 'info'}`}
            >
              {cf.message}
            </div>
          ))}
        </div>
      )}

      {feedback.suggestedComponents?.length > 0 && (
        <div>
          <div className="feedback-card__section-label feedback-card__section-label--suggested">suggested</div>
          {feedback.suggestedComponents.map((sc, i) => (
            <div key={i} className="feedback-card__suggested-item">
              <strong>{sc.label}</strong> ({sc.type}) — {sc.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectDescDialogProps {
  onSubmit: (description: string) => void;
  onCancel: () => void;
  isGenerating: boolean;
  onAutoSuggest: (setDesc: (s: string) => void) => void;
}

function ProjectDescDialog({ onSubmit, onCancel, isGenerating, onAutoSuggest }: ProjectDescDialogProps) {
  const [desc, setDesc] = useState('');

  return (
    <div className="project-desc-dialog__overlay" onClick={onCancel}>
      <div className="project-desc-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="project-desc-dialog__title">Describe your project</h3>
        <p className="project-desc-dialog__subtitle">
          Provide context so the LLM knows what you're building and can give relevant feedback.
        </p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What is this project? What problem does it solve? What are the constraints?"
          className="project-desc-dialog__textarea"
          autoFocus
        />
        <div className="project-desc-dialog__actions">
          <button
            onClick={() => onAutoSuggest(setDesc)}
            disabled={isGenerating}
            className="project-desc-dialog__auto-btn"
            title="Generates a project description based on your canvas components and parent project context"
          >
            {isGenerating ? 'generating...' : 'Auto Suggest'}
          </button>
          <button onClick={onCancel} className="project-desc-dialog__cancel-btn">
            cancel
          </button>
          <button
            onClick={() => { if (desc.trim()) onSubmit(desc.trim()); }}
            disabled={!desc.trim()}
            className="project-desc-dialog__submit-btn"
          >
            get feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ wizardMode }: { wizardMode?: 'database' | 'api' | boolean } = {}) {
  const { chatMessages, addChatMessage, isLoading, setIsLoading, feedbackMode, setFeedbackMode, getDesignConfig, getWizardDesignConfig, getApiWizardDesignConfig, setLastFeedback, currentQuestionId, currentProjectId, questions, projects, mode, ollamaConnected, setOllamaConnected, setAvailableModels } = useAppStore();
  const [input, setInput] = useState('');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showProjectDescDialog, setShowProjectDescDialog] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const getContext = (projectDescription?: string): string => {
    if (mode === 'practice') {
      const q = questions.find((q) => q.id === currentQuestionId);
      if (!q) return '';
      let context = `Question: ${q.title}\n`;
      if (q.description) context += `Description: ${q.description}\n`;
      context += `Functional Requirements: ${q.functionalRequirements}\n`;
      if (q.nonFunctionalRequirements) context += `Non-functional Requirements: ${q.nonFunctionalRequirements}\n`;
      if (q.expectedComponents && q.expectedComponents.length > 0) {
        context += `Expected Components: ${q.expectedComponents.join(', ')}\n`;
      }
      if (q.evaluationCriteria && q.evaluationCriteria.length > 0) {
        context += `Evaluation Criteria: ${q.evaluationCriteria.join('; ')}\n`;
      }
      return context;
    }
    return projectDescription || '';
  };

  const getParentDescriptions = (): string => {
    if (!currentProjectId) return '';
    const parts = currentProjectId.split('_');
    const descriptions: string[] = [];
    for (let i = 1; i <= parts.length; i++) {
      const parentId = parts.slice(0, i).join('_');
      const p = projects.find((proj) => proj.id === parentId);
      if (p?.description) {
        descriptions.push(`${p.name}: ${p.description}`);
      }
    }
    return descriptions.join('\n');
  };

  const handleAutoSuggest = async (setDesc: (s: string) => void) => {
    setIsAutoGenerating(true);
    const designConfig = getDesignConfig();
    const parentContext = getParentDescriptions();
    const prompt = `Based on this architecture diagram and context, generate a concise project description (2-3 sentences) explaining what this system does and its key constraints.\n\nParent project context:\n${parentContext || 'None'}\n\nArchitecture:\n${JSON.stringify(designConfig, null, 2)}\n\nRespond with only the project description, no formatting or labels.`;

    const result = await window.api.chat({ message: prompt, designConfig });
    setIsAutoGenerating(false);

    if (result.success && result.response) {
      setDesc(result.response);
    }
  };

  const handleGetFeedback = async (projectDescription?: string) => {
    if (!wizardMode && mode === 'project' && !projectDescription) {
      setShowProjectDescDialog(true);
      return;
    }

    setIsLoading(true);
    const isDbWizard = wizardMode === true || wizardMode === 'database';
    const isApiWizard = wizardMode === 'api';
    const designConfig = isDbWizard ? getWizardDesignConfig() : isApiWizard ? getApiWizardDesignConfig() : getDesignConfig();
    const baseContext = getContext(projectDescription);
    const context = isDbWizard ? `${baseContext}\nReviewing: Database schema design` : isApiWizard ? `${baseContext}\nReviewing: REST API design` : baseContext;
    const submissionType = isDbWizard ? 'database-schema' : isApiWizard ? 'api-design' : undefined;

    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: `get ${feedbackMode} feedback${isDbWizard ? ' (schema)' : isApiWizard ? ' (api)' : ''}`,
      timestamp: new Date().toISOString(),
      type: 'chat',
    });

    const result = await window.api.processSubmission({ designConfig, mode: feedbackMode, context, type: submissionType });

    if (result.success && result.feedback) {
      const feedback = result.feedback as FeedbackResponse;
      setLastFeedback(feedback);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        type: 'feedback',
        feedback,
      });
    } else {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.error === 'cancelled' ? 'Cancelled.' : `Error: ${result.error}`,
        timestamp: new Date().toISOString(),
        type: 'chat',
      });
    }
    setIsLoading(false);
  };

  const handleProjectDescSubmit = (description: string) => {
    setShowProjectDescDialog(false);
    handleGetFeedback(description);
  };

  const handleChat = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    setIsLoading(true);

    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'chat',
    });

    const isDbWizard = wizardMode === true || wizardMode === 'database';
    const isApiWizard = wizardMode === 'api';
    const designConfig = isDbWizard ? getWizardDesignConfig() : isApiWizard ? getApiWizardDesignConfig() : getDesignConfig();
    const result = await window.api.chat({ message, designConfig, questionId: currentQuestionId, projectId: currentProjectId });

    addChatMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.success ? (result.response || '') : `Error: ${result.error}`,
      timestamp: new Date().toISOString(),
      type: 'chat',
    });
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const handleRetryConnection = async () => {
    const result = await window.api.checkOllama();
    setOllamaConnected(result.connected);
    if (result.models) setAvailableModels(result.models);
  };

  const modeLabels: Record<FeedbackMode, string> = {
    suggestions: 'suggestions',
    critique: 'critique',
    youwillregretthis: 'you will regret this',
  };

  if (!ollamaConnected) {
    return (
      <div className="right-panel">
        <div className="right-panel__ollama-notice">
          <div className="right-panel__ollama-title">Ollama not detected</div>
          <div className="right-panel__ollama-desc">
            This app uses Ollama to run local LLMs for feedback. Install it to get started:
          </div>
          <div className="right-panel__ollama-steps">
            <div className="right-panel__ollama-step">
              1. Download from <span className="right-panel__ollama-code">ollama.com</span>
            </div>
            <div className="right-panel__ollama-step">
              2. Install and run the app
            </div>
            <div className="right-panel__ollama-step">
              3. Pull a model: <span className="right-panel__ollama-code">ollama pull gemma4</span>
            </div>
            <div className="right-panel__ollama-step">
              4. Click retry below
            </div>
          </div>
          <button onClick={handleRetryConnection} className="right-panel__ollama-retry">
            retry connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <div className="right-panel__toolbar">
        <button
          onClick={() => handleGetFeedback()}
          disabled={isLoading}
          className="right-panel__feedback-btn"
        >
          {isLoading ? 'thinking...' : 'get feedback'}
        </button>
        <div className="right-panel__mode-wrapper">
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="right-panel__mode-btn"
          >
            {modeLabels[feedbackMode]} ▾
          </button>
          {showModeDropdown && (
            <div className="right-panel__mode-dropdown">
              {(['suggestions', 'critique', 'youwillregretthis'] as FeedbackMode[]).map((m) => (
                <div
                  key={m}
                  onClick={() => { setFeedbackMode(m); setShowModeDropdown(false); }}
                  className={`right-panel__mode-option ${m === feedbackMode ? 'right-panel__mode-option--active' : ''}`}
                >
                  {modeLabels[m]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="right-panel__messages">
        {chatMessages.length === 0 && (
          <div className="right-panel__empty">
            click "get feedback" or ask something below
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`right-panel__message right-panel__message--${msg.role}`}>
            {msg.type === 'feedback' && msg.feedback ? (
              <FeedbackCard feedback={msg.feedback} wizardMode={wizardMode} />
            ) : (
              <div className={`right-panel__bubble right-panel__bubble--${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="right-panel__loading">...</div>
        )}
      </div>

      <div className="right-panel__input-area">
        <div className="right-panel__input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ask a question..."
            disabled={isLoading}
            className="right-panel__input"
          />
          <button
            onClick={handleChat}
            disabled={isLoading || !input.trim()}
            className="right-panel__send-btn"
          >
            send
          </button>
        </div>
      </div>

      {showProjectDescDialog && (
        <ProjectDescDialog
          onSubmit={handleProjectDescSubmit}
          onCancel={() => setShowProjectDescDialog(false)}
          isGenerating={isAutoGenerating}
          onAutoSuggest={handleAutoSuggest}
        />
      )}
    </div>
  );
}
