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

export interface SocialPost {
  id: string;
  platform: 'x' | 'tiktok' | 'facebook';
  type: 'post' | 'reply' | 'retweet' | 'thread';
  content: string;
  media_notes?: string;
  hashtags: string[];
  status: 'draft' | 'approved' | 'posted' | 'rejected';
  suggested_date: string;
  created_at: string;
  performance?: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
  } | null;
}

export interface SocialIdea {
  id: string;
  title: string;
  description: string;
  platform: 'x' | 'tiktok' | 'both';
  content_type: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  suggested_timing: string;
  created_at: string;
}
