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
  StickyNote,
  Search,
  Bell,
  Radio,
  Workflow,
  Clock,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import './LeftPanel.css';

const COMPONENT_LIBRARY = [
  { type: 'service', label: 'Service', Icon: Server },
  { type: 'database', label: 'Database', Icon: Database },
  { type: 'cache', label: 'Cache', Icon: Zap },
  { type: 'queue', label: 'Message Queue', Icon: Layers },
  { type: 'loadbalancer', label: 'Load Balancer', Icon: GitFork },
  { type: 'cdn', label: 'CDN', Icon: Globe },
  { type: 'gateway', label: 'API Gateway', Icon: DoorOpen },
  { type: 'client', label: 'Client', Icon: Monitor },
  { type: 'storage', label: 'Storage', Icon: HardDrive },
  { type: 'dns', label: 'DNS', Icon: Link },
  { type: 'search', label: 'Search', Icon: Search },
  { type: 'notification', label: 'Notification', Icon: Bell },
  { type: 'streaming', label: 'Streaming', Icon: Radio },
  { type: 'pipeline', label: 'Pipeline', Icon: Workflow },
  { type: 'scheduler', label: 'Scheduler', Icon: Clock },
  { type: 'monitoring', label: 'Monitoring', Icon: Activity },
  { type: 'annotation', label: 'Text Note', Icon: StickyNote },
];

export function LeftPanel() {
  const { questions, projects, mode, currentQuestionId, currentProjectId } = useAppStore();

  const handleDragStart = (e: React.DragEvent, componentType: string, label: string) => {
    e.dataTransfer.setData('application/reactflow-type', componentType);
    e.dataTransfer.setData('application/reactflow-label', label);
    e.dataTransfer.effectAllowed = 'move';
  };

  const currentTitle = () => {
    if (mode === 'practice') {
      const q = questions.find((q) => q.id === currentQuestionId);
      return q?.title || 'Untitled';
    }
    const p = projects.find((p) => p.id === currentProjectId);
    return p?.name || 'Untitled';
  };

  return (
    <div className="left-panel">
      <div className="left-panel__header">
        <div className="left-panel__mode">
          {mode === 'practice' ? 'question' : 'project'}
        </div>
        <div className="left-panel__title">
          {currentTitle()}
        </div>
      </div>

      <div className="left-panel__content">
        <div className="left-panel__section-title">components</div>
        <div className="left-panel__list">
          {COMPONENT_LIBRARY.map((comp) => (
            <div
              key={comp.type}
              draggable
              onDragStart={(e) => handleDragStart(e, comp.type, comp.label)}
              className="left-panel__item"
            >
              <comp.Icon size={16} strokeWidth={1.5} color="#666" />
              <span className="left-panel__item-label">{comp.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
