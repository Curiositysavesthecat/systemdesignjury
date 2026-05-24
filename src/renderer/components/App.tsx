import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Landing } from './Landing';
import { Workspace } from './Workspace';
import { DatabaseWizard } from './DatabaseWizard';
import { ApiWizard } from './ApiWizard';
import { BUNDLED_QUESTIONS } from '../questions/bundled';
import type { Question } from '../types/schemas';

function withDefaults(q: any): Question {
  const bundled = BUNDLED_QUESTIONS.find((b) => b.id === q.id);
  return {
    ...q,
    difficulty: q.difficulty || bundled?.difficulty || 'medium',
    tags: q.tags || bundled?.tags || [],
  };
}

export function App() {
  const { currentView, setQuestions, setProjects } = useAppStore();

  useEffect(() => {
    async function init() {
      const [questionsData, projectsData] = await Promise.all([
        window.api.getQuestions(),
        window.api.getProjects(),
      ]);

      if (questionsData.questions.length === 0) {
        for (const q of BUNDLED_QUESTIONS) {
          await window.api.createQuestion(q);
        }
        const refreshed = await window.api.getQuestions();
        setQuestions(refreshed.questions.map(withDefaults));
      } else {
        setQuestions(questionsData.questions.map(withDefaults));
      }

      setProjects(projectsData.projects);
    }
    init();
  }, [setQuestions, setProjects]);

  if (currentView === 'database-wizard') {
    return <DatabaseWizard />;
  }
  if (currentView === 'api-wizard') {
    return <ApiWizard />;
  }
  if (currentView === 'workspace') {
    return <Workspace />;
  }
  return <Landing />;
}
