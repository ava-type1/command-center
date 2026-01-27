export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface ChangelogEntry {
  date: string;
  summary: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'idea';
  progress: number; // 0-100 overall completion percentage
  color: string;
  lastUpdated: string;
  lastWorkedOn: string;
  todos: Todo[];
  changelog: ChangelogEntry[];
  repoUrl?: string;
  liveUrl?: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'saas' | 'product' | 'feature' | 'improvement';
  potential: 'low' | 'medium' | 'high';
  createdAt: string;
  notes?: string;
}
