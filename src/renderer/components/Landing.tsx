import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Question, Project, Difficulty, ChatMessage } from '../types/schemas';
import './Landing.css';

declare global {
  interface Window {
    api: {
      getConfig: () => Promise<unknown>;
      saveConfig: (config: unknown) => Promise<void>;
      setModel: (model: string) => Promise<void>;
      getQuestions: () => Promise<{ questions: Question[] }>;
      createQuestion: (q: unknown) => Promise<void>;
      loadSubmission: (qId: string, sId: string) => Promise<unknown>;
      saveSubmission: (qId: string, sId: string, canvas: unknown) => Promise<void>;
      getProjects: () => Promise<{ projects: Project[] }>;
      createProject: (p: unknown) => Promise<void>;
      loadProject: (pId: string) => Promise<unknown>;
      saveProject: (pId: string, canvas: unknown) => Promise<void>;
      processSubmission: (params: unknown) => Promise<{ success: boolean; feedback?: unknown; error?: string }>;
      chat: (params: unknown) => Promise<{ success: boolean; response?: string; error?: string }>;
      checkOllama: () => Promise<{ connected: boolean; models?: string[] }>;
      pullModel: (modelName: string) => Promise<{ success: boolean; error?: string }>;
      onPullProgress: (cb: (data: { model: string; percent: number; status: string }) => void) => () => void;
      onAppClosing: (cb: () => void) => () => void;
    };
  }
}

const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; color: string; label: string }> = {
  easy: { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', label: 'Easy' },
  medium: { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', label: 'Medium' },
  hard: { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', label: 'Hard' },
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\s]+/g, '');
}

export function Landing() {
  const { setView, setMode, setCurrentQuestion, setCurrentProject, setNodes, setEdges, setChatMessages, questions, projects, setQuestions, setProjects } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<'practice' | 'project'>('practice');
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFR, setNewFR] = useState('');
  const [newNFR, setNewNFR] = useState('');

  const [addingSubprojectOf, setAddingSubprojectOf] = useState<string | null>(null);
  const [showNewRootProject, setShowNewRootProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [nameError, setNameError] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    questions.forEach((q) => q.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [questions]);

  const hasActiveFilters = selectedDifficulties.size > 0 || selectedTags.size > 0;

  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (searchQuery.trim()) {
      const q = normalize(searchQuery);
      result = result.filter((question) => normalize(question.title).includes(q));
    }

    if (selectedDifficulties.size > 0) {
      result = result.filter((question) => selectedDifficulties.has(question.difficulty));
    }

    if (selectedTags.size > 0) {
      result = result.filter((question) => question.tags?.some((tag) => selectedTags.has(tag)));
    }

    return result;
  }, [questions, searchQuery, selectedDifficulties, selectedTags]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return { projects, expandIds: new Set<string>() };
    const q = normalize(searchQuery);
    const matched = projects.filter((p) => normalize(p.name).includes(q) || normalize(p.id).includes(q));
    const expandIds = new Set<string>();
    for (const p of matched) {
      const parts = p.id.split('_');
      for (let i = 1; i < parts.length; i++) {
        expandIds.add(parts.slice(0, i).join('_'));
      }
    }
    const visibleIds = new Set<string>();
    for (const p of matched) {
      visibleIds.add(p.id);
      const parts = p.id.split('_');
      for (let i = 1; i <= parts.length; i++) {
        visibleIds.add(parts.slice(0, i).join('_'));
      }
    }
    return { projects: projects.filter((p) => visibleIds.has(p.id)), expandIds };
  }, [projects, searchQuery]);

  const toggleDifficulty = (d: Difficulty) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleClearFilters = () => {
    setSelectedDifficulties(new Set());
    setSelectedTags(new Set());
  };

  const handleSelectQuestion = async (question: Question) => {
    setMode('practice');
    const submissionId = question.submissions.length > 0
      ? question.submissions[question.submissions.length - 1]
      : `submission-1`;

    if (question.submissions.length > 0) {
      const canvas = await window.api.loadSubmission(question.id, submissionId);
      if (canvas && typeof canvas === 'object') {
        const c = canvas as { nodes?: unknown[]; edges?: unknown[]; chatHistory?: ChatMessage[] };
        setNodes((c.nodes || []) as any);
        setEdges((c.edges || []) as any);
        setChatMessages(c.chatHistory || []);
      }
    } else {
      setNodes([]);
      setEdges([]);
      setChatMessages([]);
    }

    setCurrentQuestion(question.id, submissionId);
    setView('workspace');
  };

  const handleCreateQuestion = async () => {
    if (!newTitle.trim() || !newFR.trim()) return;
    const id = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await window.api.createQuestion({ id, title: newTitle, functionalRequirements: newFR, nonFunctionalRequirements: newNFR });
    const data = await window.api.getQuestions();
    setQuestions(data.questions);
    setShowNewQuestion(false);
    setNewTitle('');
    setNewFR('');
    setNewNFR('');
  };

  const handleSelectProject = async (project: Project) => {
    setMode('project');
    const canvas = await window.api.loadProject(project.id);
    if (canvas && typeof canvas === 'object') {
      const c = canvas as { nodes?: unknown[]; edges?: unknown[]; chatHistory?: ChatMessage[] };
      setNodes((c.nodes || []) as any);
      setEdges((c.edges || []) as any);
      setChatMessages(c.chatHistory || []);
    } else {
      setNodes([]);
      setEdges([]);
      setChatMessages([]);
    }
    setCurrentProject(project.id);
    setView('workspace');
  };

  const validateProjectName = (name: string): boolean => {
    if (name.includes('_')) {
      setNameError('Name cannot contain underscore (_)');
      return false;
    }
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreateProject = async (parentId?: string) => {
    if (!validateProjectName(newProjectName)) return;
    const slug = newProjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = parentId ? `${parentId}_${slug}` : slug;

    const depth = id.split('_').length - 1;
    if (depth >= 10) {
      setNameError('Maximum nesting depth reached');
      return;
    }

    await window.api.createProject({ id, name: newProjectName, description: newProjectDesc });
    const data = await window.api.getProjects();
    setProjects(data.projects);
    setAddingSubprojectOf(null);
    setShowNewRootProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setNameError('');
  };

  const getChildren = (parentId: string, projectList: Project[]) => {
    return projectList.filter((p) => {
      const parts = p.id.split('_');
      parts.pop();
      return parts.join('_') === parentId;
    });
  };

  const getRootProjects = (projectList: Project[]) => {
    return projectList.filter((p) => !p.id.includes('_'));
  };

  const isExpanded = (id: string) => {
    if (searchQuery.trim() && filteredProjects.expandIds.has(id)) return true;
    return expandedNodes.has(id);
  };

  const hasChildren = (id: string, projectList: Project[]) => {
    return projectList.some((p) => {
      const parts = p.id.split('_');
      parts.pop();
      return parts.join('_') === id;
    });
  };

  const renderProjectNode = (project: Project, depth: number, projectList: Project[]) => {
    const children = getChildren(project.id, projectList);
    const expanded = isExpanded(project.id);
    const hasKids = hasChildren(project.id, projectList);

    return (
      <div key={project.id}>
        <div className="landing__project-row" style={{ marginLeft: depth * 18 }}>
          {hasKids ? (
            <button onClick={() => toggleExpand(project.id)} className="landing__project-toggle">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="landing__project-toggle-spacer" />
          )}
          <div onClick={() => handleSelectProject(project)} className="landing__project-card">
            <div className="landing__project-name">{project.name}</div>
            {project.description && <div className="landing__project-desc">{project.description}</div>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setAddingSubprojectOf(project.id); setShowNewRootProject(false); setNewProjectName(''); setNewProjectDesc(''); setNameError(''); }}
            title="Add subproject"
            className="landing__project-add-btn"
          >
            +
          </button>
        </div>
        {addingSubprojectOf === project.id && renderProjectForm(project.id, depth)}
        {expanded && children.map((child) => renderProjectNode(child, depth + 1, projectList))}
      </div>
    );
  };

  const renderProjectForm = (parentId?: string, depth?: number) => (
    <div className="landing__project-form" style={{ marginLeft: ((depth || 0) + 1) * 18 + 20 }}>
      <input
        value={newProjectName}
        onChange={(e) => { setNewProjectName(e.target.value); setNameError(''); }}
        placeholder="Project name"
        className="landing__project-form-input"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(parentId); if (e.key === 'Escape') { setAddingSubprojectOf(null); setShowNewRootProject(false); } }}
      />
      {nameError && <div className="landing__name-error">{nameError}</div>}
      <textarea
        value={newProjectDesc}
        onChange={(e) => setNewProjectDesc(e.target.value)}
        placeholder="Description (optional)"
        className="landing__project-form-textarea"
      />
      <div className="landing__form-actions">
        <button onClick={() => handleCreateProject(parentId)} className="landing__form-submit">Create</button>
        <button onClick={() => { setAddingSubprojectOf(null); setShowNewRootProject(false); setNameError(''); }} className="landing__form-cancel">Cancel</button>
      </div>
    </div>
  );

  const handleSearchToggle = () => {
    if (searchOpen) {
      setSearchQuery('');
    }
    setSearchOpen(!searchOpen);
  };

  return (
    <div className="landing">
      <div className="landing__header">
        <h1 className="landing__title">System Design Jury</h1>
        <p className="landing__subtitle">practice system design, build architectures, get local LLM feedback</p>
      </div>

      <div className="landing__tabs">
        <button
          onClick={() => { setSelectedTab('practice'); setSearchQuery(''); setSearchOpen(false); }}
          className={`landing__tab ${selectedTab === 'practice' ? 'landing__tab--active' : ''}`}
        >
          Practice
        </button>
        <div className="landing__tab-divider" />
        <button
          onClick={() => { setSelectedTab('project'); setSearchQuery(''); setSearchOpen(false); }}
          className={`landing__tab ${selectedTab === 'project' ? 'landing__tab--active' : ''}`}
        >
          Projects
        </button>
      </div>

      <div className="landing__toolbar">
        <div className="landing__toolbar-row">
          <div className="landing__toolbar-left">
            <h2 className="landing__section-title">
              {selectedTab === 'practice' ? 'Questions' : 'Projects'}
            </h2>
            <button
              onClick={handleSearchToggle}
              className={`landing__search-btn ${searchOpen ? 'landing__search-btn--active' : ''}`}
            >
              <Search size={15} strokeWidth={1.8} />
            </button>
            {searchOpen && (
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder="search..."
                autoFocus
                className="landing__search-input"
              />
            )}
            {selectedTab === 'practice' && (
              <div ref={filterRef} className="landing__filter-wrapper">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`landing__filter-btn ${hasActiveFilters ? 'landing__filter-btn--active' : ''}`}
                >
                  <SlidersHorizontal size={15} strokeWidth={1.8} />
                  {hasActiveFilters && <span className="landing__filter-dot" />}
                </button>

                {filterOpen && (
                  <div className="landing__filter-dropdown">
                    <div className="landing__filter-label">Difficulty</div>
                    <div className="landing__filter-difficulties">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleDifficulty(d)}
                          className="landing__difficulty-btn"
                          style={{
                            borderColor: selectedDifficulties.has(d) ? DIFFICULTY_STYLES[d].color : undefined,
                            background: selectedDifficulties.has(d) ? DIFFICULTY_STYLES[d].bg : undefined,
                            color: selectedDifficulties.has(d) ? DIFFICULTY_STYLES[d].color : undefined,
                          }}
                        >
                          {DIFFICULTY_STYLES[d].label}
                        </button>
                      ))}
                    </div>

                    <div className="landing__filter-label">Topics</div>
                    <div className="landing__filter-tags">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`landing__tag-btn ${selectedTags.has(tag) ? 'landing__tag-btn--active' : ''}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="landing__filter-count">
                      {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} match
                    </div>

                    <div className="landing__filter-actions">
                      <button
                        onClick={() => setFilterOpen(false)}
                        disabled={filteredQuestions.length === 0}
                        className="landing__filter-apply"
                      >
                        Apply
                      </button>
                      <button onClick={handleClearFilters} className="landing__filter-clear">
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => selectedTab === 'practice' ? setShowNewQuestion(true) : (() => { setShowNewRootProject(true); setAddingSubprojectOf(null); })()}
            className="landing__new-btn"
          >
            + new {selectedTab === 'practice' ? 'question' : 'project'}
          </button>
        </div>

        {showNewQuestion && selectedTab === 'practice' && (
          <div className="landing__form">
            <input
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Question title (e.g., Design a URL shortener)"
              className="landing__form-input"
              autoFocus
            />
            <textarea
              value={newFR} onChange={(e) => setNewFR(e.target.value)}
              placeholder="Functional requirements"
              className="landing__form-textarea"
            />
            <textarea
              value={newNFR} onChange={(e) => setNewNFR(e.target.value)}
              placeholder="Non-functional requirements (optional)"
              className="landing__form-textarea landing__form-textarea--small"
            />
            <div className="landing__form-actions">
              <button onClick={handleCreateQuestion} className="landing__form-submit">Create</button>
              <button onClick={() => setShowNewQuestion(false)} className="landing__form-cancel">Cancel</button>
            </div>
          </div>
        )}

        {showNewRootProject && !addingSubprojectOf && selectedTab === 'project' && renderProjectForm()}

        <div className="landing__divider" />
      </div>

      <div className="landing__content">
        {selectedTab === 'practice' && (
          <div className="landing__grid">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                onClick={() => handleSelectQuestion(q)}
                className="landing__question-card"
              >
                <div className="landing__question-header">
                  <div className="landing__question-title">{q.title}</div>
                  {q.difficulty && (
                    <span
                      className="landing__difficulty-badge"
                      style={{
                        background: DIFFICULTY_STYLES[q.difficulty].bg,
                        color: DIFFICULTY_STYLES[q.difficulty].color,
                      }}
                    >
                      {DIFFICULTY_STYLES[q.difficulty].label}
                    </span>
                  )}
                </div>
                <div className="landing__question-submissions">
                  {q.submissions.length} submission{q.submissions.length !== 1 ? 's' : ''}
                </div>
                {q.tags && q.tags.length > 0 && (
                  <div className="landing__question-tags">
                    {q.tags.map((tag) => (
                      <span key={tag} className="landing__tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <p className="landing__empty">
                {searchQuery || hasActiveFilters ? 'No matching questions' : 'No questions yet'}
              </p>
            )}
          </div>
        )}

        {selectedTab === 'project' && (
          <div>
            {getRootProjects(filteredProjects.projects).map((p) => renderProjectNode(p, 0, filteredProjects.projects))}
            {filteredProjects.projects.length === 0 && (
              <p className="landing__empty">
                {searchQuery ? 'No matching projects' : 'No projects yet'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
