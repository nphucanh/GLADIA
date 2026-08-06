import { useState } from 'react';
import { Project } from '../types';

export function useProjectModal() {
  const [selected, setSelected] = useState<Project | null>(null);
  return {
    selected,
    open: (p: Project) => setSelected(p),
    close: () => setSelected(null),
  };
}
