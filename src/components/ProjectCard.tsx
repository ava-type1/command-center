import { Clock, ExternalLink, Github } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const statusLabels = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  idea: 'Idea',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const completedTodos = project.todos.filter(t => t.done).length;
  const totalTodos = project.todos.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="glass glass-hover rounded-2xl p-5 cursor-pointer transition-all duration-300 group"
      style={{
        borderColor: `${project.color}15`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              backgroundColor: project.color,
              boxShadow: `0 0 10px ${project.color}60`,
            }}
          />
          <h3 className="text-lg font-semibold text-white group-hover:text-neon-green transition-colors">
            {project.name}
          </h3>
        </div>
        <span className={`status-${project.status} text-xs font-medium px-2 py-1 rounded-full`}>
          {statusLabels[project.status]}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

      {/* Last worked on */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Last worked on:</p>
        <p className="text-sm text-gray-300 line-clamp-1">{project.lastWorkedOn}</p>
      </div>

      {/* Progress bar */}
      {totalTodos > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{completedTodos}/{totalTodos} tasks</span>
          </div>
          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${project.color}, ${project.color}80)`,
                boxShadow: `0 0 10px ${project.color}40`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDate(project.lastUpdated)}
        </div>
        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-neon-green transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
