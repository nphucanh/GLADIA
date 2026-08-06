import { createContext, useContext, ReactNode } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  usingMockData: boolean;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  loading: true,
  usingMockData: true,
});

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const value = useProjects();
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjectsContext(): ProjectsContextValue {
  return useContext(ProjectsContext);
}
